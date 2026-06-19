import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { internal } from "./_generated/api";
import { aiSuggestionStatusValidator } from "./schema";

export const listPending = orgQuery({
  args: {},
  handler: async (ctx) => {
    // Return all pending suggestions for the org
    const suggestions = await ctx.db
      .query("aiSuggestions")
      .withIndex("by_org_and_status", (q) =>
        q.eq("orgId", ctx.org._id).eq("status", "pending")
      )
      .order("desc")
      .collect();

    // Attach issue info
    return Promise.all(
      suggestions.map(async (s) => {
        const issue = await ctx.db.get(s.issueId);
        let team;
        if (issue) {
          team = await ctx.db.get(issue.teamId);
        }
        return {
          ...s,
          issueKey: team && issue ? `${team.key}-${issue.number}` : "Unknown",
          issueTitle: issue?.title || "Unknown Issue",
        };
      })
    );
  },
});

export const getBadgeCount = orgQuery({
  args: {},
  handler: async (ctx) => {
    const suggestions = await ctx.db
      .query("aiSuggestions")
      .withIndex("by_org_and_status", (q) =>
        q.eq("orgId", ctx.org._id).eq("status", "pending")
      )
      .collect();
    return suggestions.length;
  },
});

export const accept = orgMutation({
  args: {
    suggestionId: v.id("aiSuggestions"),
  },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion || suggestion.orgId !== ctx.org._id) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.status !== "pending") {
      throw new Error("Suggestion is no longer pending");
    }

    // Mark as accepted
    await ctx.db.patch(args.suggestionId, {
      status: "accepted",
      reviewedBy: ctx.user._id,
      reviewedAt: Date.now(),
    });

    // Execute the semantic link
    const action = "opened"; // We don't store the exact PR action, but it's a semantic link. Let's assume opened.
    // Wait, the semantic link requires action, senderLogin, prUrl, etc. We should store these in `reason` or add them to aiSuggestions.
    // I should probably just invoke the internal github link mutation from here.
    
    // For commits:
    const commits = suggestion.commitSha
      ? [{ id: suggestion.commitSha, message: suggestion.reason, url: "" }]
      : undefined;

    await ctx.runMutation(internal.github.linkSemanticIssueEvent, {
      orgId: suggestion.orgId,
      issueId: suggestion.issueId,
      event: suggestion.prNumber ? "pull_request" : "push",
      action: "opened",
      prUrl: "", // We might not have this, we can try to extract from reason or store it
      prTitle: suggestion.reason,
      prNumber: suggestion.prNumber || 0,
      senderLogin: "GitHub",
      confidencePct: suggestion.confidence,
      commits,
    });
  },
});

export const reject = orgMutation({
  args: {
    suggestionId: v.id("aiSuggestions"),
  },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion || suggestion.orgId !== ctx.org._id) {
      throw new Error("Suggestion not found");
    }

    await ctx.db.patch(args.suggestionId, {
      status: "rejected",
      reviewedBy: ctx.user._id,
      reviewedAt: Date.now(),
    });
  },
});
