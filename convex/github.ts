import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { logActivity } from "./lib/activity";

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
    
    const issueKeys = extractIssueKeys(textToScan);
    if (issueKeys.length === 0) {
      return { processed: 0, reason: "No issue keys found in payload" };
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
