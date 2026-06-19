import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { logActivity } from "./lib/activity";
import { internal } from "./_generated/api";
import { hasAiAccess } from "./lib/limits";
import { embedText } from "./agent/embeddings";
import { isAiConfigured } from "./agent/models";

// Extract unique issue keys like "ENG-12" from text
function extractIssueKeys(text: string): { key: string; number: number }[] {
  if (!text) return [];
  const matches = text.match(/([a-zA-Z0-9]+)-(\d+)/g);
  if (!matches) return [];
  
  const results: { key: string; number: number }[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const parts = match.split("-");
    const key = parts[0].toUpperCase();
    const number = parseInt(parts[1], 10);
    const identifier = `${key}-${number}`;
    if (!seen.has(identifier)) {
      seen.add(identifier);
      results.push({ key, number });
    }
  }
  return results;
}

interface GitHubCommit {
  message?: string;
  id?: string;
  url?: string;
}

export const handleGithubEvent = internalMutation({
  args: {
    event: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const body = JSON.parse(args.payload);
    
    let textToScan = "";
    let action = "";
    let prUrl = "";
    let prTitle = "";
    let prNumber = 0;
    let senderLogin = "GitHub";
    
    if (args.event === "pull_request") {
      action = body.action || "";
      const pr = body.pull_request || {};
      textToScan = `${pr.title || ""} ${pr.body || ""}`;
      prUrl = pr.html_url || "";
      prTitle = pr.title || "";
      prNumber = pr.number || 0;
      senderLogin = body.sender?.login || "GitHub";
    } else if (args.event === "push") {
      const commits = (body.commits || []) as GitHubCommit[];
      textToScan = commits.map((c) => c.message || "").join(" ");
      senderLogin = body.pusher?.name || "GitHub";
    }
    
    const repoFullName = body.repository?.full_name || "";
    if (!repoFullName) return { processed: 0, reason: "No repository in payload" };

    const connections = await ctx.db
      .query("connectedRepos")
      .withIndex("by_repo", (q) => q.eq("repoName", repoFullName))
      .collect();
    
    if (connections.length === 0) {
      return { processed: 0, reason: "Repository not connected to any organization" };
    }

    // ── AUTOMATIONS TRIGGER (Phase 2) ──
    let triggerType: "github_pr_opened" | "github_pr_merged" | "github_push" | null = null;
    if (args.event === "pull_request" && (action === "opened" || action === "reopened")) {
      triggerType = "github_pr_opened";
    } else if (args.event === "pull_request" && action === "closed" && body.pull_request?.merged) {
      triggerType = "github_pr_merged";
    } else if (args.event === "push") {
      triggerType = "github_push";
    }

    for (const conn of connections) {
      if (triggerType) {
        const automations = await ctx.db
          .query("automations")
          .withIndex("by_org_and_trigger", (q) => 
            q.eq("orgId", conn.orgId).eq("triggerType", triggerType!)
          )
          .collect();
          
        const activeAutomations = automations.filter(a => a.isEnabled);
        
        for (const automation of activeAutomations) {
          // Record the execution in the agentRuns ledger
          await ctx.db.insert("agentRuns", {
            orgId: conn.orgId,
            automationId: automation._id,
            skillIds: automation.targetSkillId ? [automation.targetSkillId] : [],
            loopId: automation.targetLoopId,
            triggerType: triggerType,
            executionMode: automation.executionMode,
            status: "queued",
            summary: `Triggered by ${triggerType} on ${repoFullName}`,
            startedAt: Date.now(),
          });
          
          // In Phase 3 (Loops), this is where we actually schedule the background action
          // to spawn the LLM loop. For now, it just queues it in the ledger.
        }
      }
    }

    const issueKeys = extractIssueKeys(textToScan);
    if (issueKeys.length === 0) {
      // For each connection, schedule the semantic link background action
      for (const conn of connections) {
        await ctx.scheduler.runAfter(0, internal.github.handleSemanticGithubEvent, {
          orgId: conn.orgId,
          event: args.event,
          payloadText: textToScan,
          repoFullName,
          action,
          prUrl,
          prTitle,
          prNumber,
          senderLogin,
          commits: args.event === "push" ? (body.commits || []).map((c: GitHubCommit) => ({
            message: c.message || "",
            id: c.id || "",
            url: c.url || "",
          })) : undefined,
          merged: args.event === "pull_request" ? (body.pull_request?.merged || false) : undefined,
        });
      }
      return { processed: 0, status: "scheduled_semantic_scan" };
    }
    
    let processedCount = 0;
    
    for (const { key, number } of issueKeys) {
      // Find the team using filter since we don't have a single-field index on key
      const team = await ctx.db
        .query("teams")
        // eslint-disable-next-line @convex-dev/no-filter-in-query
        .filter((q) => q.eq(q.field("key"), key))
        .first();
        
      if (!team) continue;
      
      // Find the issue
      const issue = await ctx.db
        .query("issues")
        .withIndex("by_team_and_number", (q) =>
          q.eq("teamId", team._id).eq("number", number)
        )
        .unique();
        
      if (!issue) continue;
      
      // Verify that this repository is connected to the issue's organization
      const repoFullName = body.repository?.full_name || "";
      const isConnected = await ctx.db
        .query("connectedRepos")
        .withIndex("by_org", (q) => q.eq("orgId", issue.orgId))
        // eslint-disable-next-line @convex-dev/no-filter-in-query
        .filter((q) => q.eq(q.field("repoName"), repoFullName))
        .first();
        
      if (!isConnected) {
        console.warn(`Repository ${repoFullName} is not connected to organization ${issue.orgId}`);
        continue;
      }
      
      if (args.event === "pull_request") {
        if (action === "opened" || action === "reopened") {
          // Transition status to in_progress if not already there or done/canceled
          if (issue.status !== "in_progress" && issue.status !== "done" && issue.status !== "canceled") {
            await ctx.db.patch(issue._id, { status: "in_progress" });
            await logActivity(ctx, {
              orgId: issue.orgId,
              issueId: issue._id,
              actorId: issue.creatorId,
              type: "status_changed",
              field: "status",
              oldValue: issue.status,
              newValue: "in_progress",
            });
          }
          
          // Post comment linking the PR
          await ctx.db.insert("comments", {
            orgId: issue.orgId,
            issueId: issue._id,
            authorId: issue.creatorId,
            body: `🔗 **GitHub Pull Request #${prNumber}** opened by @${senderLogin}: [${prTitle}](${prUrl})`,
          });
          processedCount++;
          
        } else if (action === "closed") {
          const merged = body.pull_request?.merged || false;
          if (merged) {
            // Transition status to done
            if (issue.status !== "done") {
              await ctx.db.patch(issue._id, { status: "done" });
              await logActivity(ctx, {
                orgId: issue.orgId,
                issueId: issue._id,
                actorId: issue.creatorId,
                type: "status_changed",
                field: "status",
                oldValue: issue.status,
                newValue: "done",
              });
            }
            
            // Post comment linking the merged PR
            await ctx.db.insert("comments", {
              orgId: issue.orgId,
              issueId: issue._id,
              authorId: issue.creatorId,
              body: `✅ **GitHub Pull Request #${prNumber}** merged by @${senderLogin}: [${prTitle}](${prUrl})`,
            });
            processedCount++;
          }
        }
      } else if (args.event === "push") {
        const commits = body.commits || [];
        for (const commit of commits) {
          if (commit.message.toUpperCase().includes(`${key}-${number}`)) {
            const commitHash = commit.id?.substring(0, 7) || "";
            const commitUrl = commit.url || "";
            await ctx.db.insert("comments", {
              orgId: issue.orgId,
              issueId: issue._id,
              authorId: issue.creatorId,
              body: `💻 **GitHub commit** [${commitHash}](${commitUrl}) pushed by @${senderLogin}: _${commit.message.trim()}_`,
            });
            processedCount++;
          }
        }
      }
    }
    
    return { processed: processedCount };
  },
});

export const getOrganizationById = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orgId);
  },
});

export const handleSemanticGithubEvent = internalAction({
  args: {
    orgId: v.id("organizations"),
    event: v.string(),
    payloadText: v.string(),
    repoFullName: v.string(),
    action: v.string(),
    prUrl: v.string(),
    prTitle: v.string(),
    prNumber: v.number(),
    senderLogin: v.string(),
    commits: v.optional(
      v.array(
        v.object({
          message: v.string(),
          id: v.string(),
          url: v.string(),
        })
      )
    ),
    merged: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Get the organization and check AI access
    const org = await ctx.runQuery(internal.github.getOrganizationById, { orgId: args.orgId });
    if (!org) {
      console.warn(`Organization ${args.orgId} not found.`);
      return;
    }
    
    // Check if AI features are enabled/configured
    if (!hasAiAccess(org)) {
      console.warn(`Organization ${args.orgId} does not have AI access.`);
      return;
    }
    
    if (!isAiConfigured()) {
      console.warn("Skipping semantic auto-link: OPENAI_API_KEY is not set");
      return;
    }
    
    // 2. Generate embedding for the payloadText
    const embedding = await embedText(args.payloadText);
    
    // 3. Search issues by embedding
    const results = await ctx.vectorSearch("issues", "by_embedding", {
      vector: embedding,
      limit: 5,
      filter: (q) => q.eq("orgId", args.orgId),
    });
    
    // Filter by similarity threshold
    const AUTO_LINK_THRESHOLD = 0.88;
    const MIN_SCORE_GAP = 0.04;
    const SUGGESTION_THRESHOLD = 0.78;

    const candidates = results.filter((r) => r._score >= SUGGESTION_THRESHOLD);
    if (candidates.length === 0) {
      console.log(`No issue match found with similarity >= ${SUGGESTION_THRESHOLD} for text: "${args.payloadText.slice(0, 100)}..."`);
      return;
    }
    
    // Top match
    const bestMatch = candidates[0];
    const secondBestScore = candidates.length > 1 ? candidates[1]._score : 0;
    const confidencePct = Math.round(bestMatch._score * 100);
    
    const isHighConfidence = bestMatch._score >= AUTO_LINK_THRESHOLD && (bestMatch._score - secondBestScore) >= MIN_SCORE_GAP;

    if (isHighConfidence) {
      // 4. Execute the mutation to link the issue and transition status
      await ctx.runMutation(internal.github.linkSemanticIssueEvent, {
        orgId: args.orgId,
        issueId: bestMatch._id,
        event: args.event,
        action: args.action,
        prUrl: args.prUrl,
        prTitle: args.prTitle,
        prNumber: args.prNumber,
        senderLogin: args.senderLogin,
        confidencePct,
        commits: args.commits,
        merged: args.merged,
      });
    } else {
      // Medium confidence: Suggestion
      await ctx.runMutation(internal.github.createSemanticSuggestionEvent, {
        orgId: args.orgId,
        issueId: bestMatch._id,
        event: args.event,
        action: args.action,
        prUrl: args.prUrl,
        prTitle: args.prTitle,
        prNumber: args.prNumber,
        senderLogin: args.senderLogin,
        confidencePct,
        commits: args.commits,
        merged: args.merged,
      });
    }
  },
});

export const linkSemanticIssueEvent = internalMutation({
  args: {
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    event: v.string(),
    action: v.string(),
    prUrl: v.string(),
    prTitle: v.string(),
    prNumber: v.number(),
    senderLogin: v.string(),
    confidencePct: v.number(),
    commits: v.optional(
      v.array(
        v.object({
          message: v.string(),
          id: v.string(),
          url: v.string(),
        })
      )
    ),
    merged: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.orgId !== args.orgId) {
      console.warn(`Issue ${args.issueId} not found or mismatch org.`);
      return;
    }
    
    // Transition status and log activity
    if (args.event === "pull_request") {
      if (args.action === "opened" || args.action === "reopened") {
        if (issue.status !== "in_progress" && issue.status !== "done" && issue.status !== "canceled") {
          await ctx.db.patch(issue._id, { status: "in_progress" });
          await logActivity(ctx, {
            orgId: issue.orgId,
            issueId: issue._id,
            actorId: issue.creatorId,
            type: "status_changed",
            field: "status",
            oldValue: issue.status,
            newValue: "in_progress",
          });
        }
        
        await ctx.db.insert("comments", {
          orgId: issue.orgId,
          issueId: issue._id,
          authorId: issue.creatorId,
          body: `🤖 **AI Semantic Link** (confidence: **${args.confidencePct}%**): Associated pull request **#${args.prNumber}** opened by @${args.senderLogin}: [${args.prTitle}](${args.prUrl})`,
        });
      } else if (args.action === "closed" && args.merged) {
        if (issue.status !== "done") {
          await ctx.db.patch(issue._id, { status: "done" });
          await logActivity(ctx, {
            orgId: issue.orgId,
            issueId: issue._id,
            actorId: issue.creatorId,
            type: "status_changed",
            field: "status",
            oldValue: issue.status,
            newValue: "done",
          });
        }
        
        await ctx.db.insert("comments", {
          orgId: issue.orgId,
          issueId: issue._id,
          authorId: issue.creatorId,
          body: `🤖 **AI Semantic Link** (confidence: **${args.confidencePct}%**): Associated merged pull request **#${args.prNumber}** by @${args.senderLogin}: [${args.prTitle}](${args.prUrl})`,
        });
      }
    } else if (args.event === "push") {
      const commits = args.commits || [];
      for (const commit of commits) {
        const commitHash = commit.id?.substring(0, 7) || "";
        const commitUrl = commit.url || "";
        await ctx.db.insert("comments", {
          orgId: issue.orgId,
          issueId: issue._id,
          authorId: issue.creatorId,
          body: `🤖 **AI Semantic Link** (confidence: **${args.confidencePct}%**): Associated commit [${commitHash}](${commitUrl}) pushed by @${args.senderLogin}: _${commit.message.trim()}_`,
        });
      }
    }
  },
});

export const createSemanticSuggestionEvent = internalMutation({
  args: {
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    event: v.string(),
    action: v.string(),
    prUrl: v.string(),
    prTitle: v.string(),
    prNumber: v.number(),
    senderLogin: v.string(),
    confidencePct: v.number(),
    commits: v.optional(
      v.array(
        v.object({
          message: v.string(),
          id: v.string(),
          url: v.string(),
        })
      )
    ),
    merged: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.orgId !== args.orgId) {
      console.warn(`Issue ${args.issueId} not found or mismatch org.`);
      return;
    }

    const mentions = issue.assigneeId ? [issue.assigneeId] : [issue.creatorId];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let suggestionData: any = {};
    let displayBody = "";

    if (args.event === "pull_request") {
      suggestionData = {
        type: "link_pr",
        prNumber: args.prNumber,
        status: args.merged ? "merged" : args.action,
        confidence: args.confidencePct,
        prUrl: args.prUrl,
        prTitle: args.prTitle,
        senderLogin: args.senderLogin,
      };
      displayBody = `🤖 **AI Suggestion** (confidence: **${args.confidencePct}%**): Does this pull request belong here? **#${args.prNumber}** opened by @${args.senderLogin}: [${args.prTitle}](${args.prUrl})\n\n<!-- ${JSON.stringify({ aiSuggestion: suggestionData })} -->`;
    } else if (args.event === "push") {
      const commits = args.commits || [];
      if (commits.length === 0) return;
      const commit = commits[0];
      const commitHash = commit.id?.substring(0, 7) || "";
      suggestionData = {
        type: "link_commit",
        commitHash,
        commitUrl: commit.url,
        confidence: args.confidencePct,
        senderLogin: args.senderLogin,
        message: commit.message.trim(),
      };
      displayBody = `🤖 **AI Suggestion** (confidence: **${args.confidencePct}%**): Does this commit belong here? [${commitHash}](${commit.url}) pushed by @${args.senderLogin}: _${commit.message.trim()}_\n\n<!-- ${JSON.stringify({ aiSuggestion: suggestionData })} -->`;
    }

    if (displayBody) {
      await ctx.db.insert("comments", {
        orgId: issue.orgId,
        issueId: issue._id,
        authorId: issue.creatorId,
        body: displayBody,
        mentions,
      });
    }
  },
});
