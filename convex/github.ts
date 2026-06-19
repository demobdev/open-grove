import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { logActivity } from "./lib/activity";
import { internal } from "./_generated/api";
import { hasAiAccess } from "./lib/limits";
import { embedText } from "./agent/embeddings";
import { isAiConfigured } from "./agent/models";
import { GITHUB_CONFIG } from "./lib/githubConfig";

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

    // ── MERGE QUEUE TRIGGER (Phase 6) ──
    if (args.event === "check_run") {
      const branchName = body.check_run?.check_suite?.head_branch;
      if (branchName && branchName.startsWith("og-merge-batch-")) {
        const conclusion = body.check_run?.conclusion;
        if (conclusion === "success" || conclusion === "failure" || conclusion === "cancelled") {
          const status = conclusion === "success" ? "success" : "failure";
          for (const conn of connections) {
            await ctx.scheduler.runAfter(0, internal.mergeQueue.handleBatchStatus, {
              orgId: conn.orgId,
              repoId: repoFullName,
              branchName,
              status,
            });
          }
        }
        return { processed: 1, reason: "Processed check_run for merge batch" };
      }
    } else if (args.event === "status") {
      const branchName = body.branches?.[0]?.name;
      if (branchName && branchName.startsWith("og-merge-batch-")) {
        const state = body.state; // success, failure, error
        if (state === "success" || state === "failure" || state === "error") {
          const status = state === "success" ? "success" : "failure";
          for (const conn of connections) {
            await ctx.scheduler.runAfter(0, internal.mergeQueue.handleBatchStatus, {
              orgId: conn.orgId,
              repoId: repoFullName,
              branchName,
              status,
            });
          }
        }
        return { processed: 1, reason: "Processed status for merge batch" };
      }
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
          // Schedule the automation dispatcher in the background to prevent webhook timeouts
          await ctx.scheduler.runAfter(0, internal.automations.dispatchAutomation, {
            automationId: automation._id,
            payload: body,
          });
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
    const { autoLink, suggestion } = GITHUB_CONFIG.thresholds;
    const AUTO_LINK_THRESHOLD = autoLink;
    const SUGGESTION_THRESHOLD = suggestion;
    const MIN_SCORE_GAP = 0.04;

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
        repoFullName: args.repoFullName,
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
    repoFullName: v.string(),
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

    let commitSha: string | undefined;
    let idempotencyKey: string;
    let reasonText = `Confidence: ${args.confidencePct}%\n`;

    if (args.event === "pull_request") {
      idempotencyKey = `${args.repoFullName}-pr-${args.prNumber}`;
      reasonText += `Matched PR Title: ${args.prTitle}\nURL: ${args.prUrl}\nBy: @${args.senderLogin}`;
    } else if (args.event === "push") {
      const commits = args.commits || [];
      if (commits.length === 0) return;
      const commit = commits[0];
      commitSha = commit.id?.substring(0, 7) || "";
      idempotencyKey = `${args.repoFullName}-commit-${commitSha}`;
      reasonText += `Matched Commit: ${commit.message.trim()}\nURL: ${commit.url}\nBy: @${args.senderLogin}`;
    } else {
      return; // Unknown event
    }

    // Check if we've already suggested (or rejected) this specific link
    const existing = await ctx.db
      .query("aiSuggestions")
      .withIndex("by_delivery", (q) => q.eq("deliveryId", idempotencyKey))
      .filter((q) => q.eq(q.field("issueId"), args.issueId))
      .first();

    if (existing) {
      console.log(`Suggestion for ${idempotencyKey} -> ${args.issueId} already exists. Status: ${existing.status}`);
      return; // Deduplicate / persist rejection
    }

    await ctx.db.insert("aiSuggestions", {
      orgId: args.orgId,
      issueId: args.issueId,
      repoId: args.repoFullName,
      prNumber: args.event === "pull_request" ? args.prNumber : undefined,
      commitSha,
      confidence: args.confidencePct,
      reason: reasonText,
      status: "pending",
      deliveryId: idempotencyKey,
    });
  },
});
