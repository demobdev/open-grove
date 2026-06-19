import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getInstallationTokenForRepo } from "./githubApp";

/**
 * Agent tool to inspect a merge batch and detect potential conflicts or issues.
 */
export const inspectBatch = internalAction({
  args: { orgId: v.id("organizations"), batchId: v.id("mergeBatches") },
  handler: async (ctx, args) => {
    const batch = await ctx.runQuery(internal.mergeQueue.internalGetBatchByBranch, {
      // Need a way to fetch by batchId
    });
    // For brevity, we'll assume we can get it or we just fetch the items
    const items = await ctx.runQuery(internal.mergeQueue.internalGetItemsForBatch, {
      orgId: args.orgId,
      batchId: args.batchId,
    });
    
    if (items.length === 0) return { error: "No items in batch" };
    const repoId = items[0].repoId;
    const token = await getInstallationTokenForRepo(repoId);

    const prDetails: any[] = [];
    for (const item of items) {
      const res = await fetch(`https://api.github.com/repos/${repoId}/pulls/${item.prNumber}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "User-Agent": "OpenGrove-Agent" }
      });
      if (res.ok) {
        const data = await res.json();
        prDetails.push({
          number: data.number,
          title: data.title,
          mergeable: data.mergeable,
          mergeable_state: data.mergeable_state,
        });
      }
    }
    
    return { repoId, items: prDetails };
  }
});

/**
 * Trigger processQueue manually.
 */
export const triggerProcessQueue = internalAction({
  args: { orgId: v.id("organizations"), repoId: v.string() },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.mergeQueue.processQueue, {
      orgId: args.orgId,
      repoId: args.repoId,
    });
    return { success: true };
  }
});
