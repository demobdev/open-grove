/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // For brevity, we'll assume we can get it or we just fetch the items
    const items = (await ctx.runQuery(internal.mergeQueue.internalGetItemsForBatch, {
      orgId: args.orgId,
      batchId: args.batchId,
    })) as Array<{ prNumber: number; repoFullName: string }>;
    
    if (items.length === 0) return { error: "No items in batch" };
    const repoFullName = items[0].repoFullName;
    const token = await getInstallationTokenForRepo(repoFullName);

    const prDetails: any[] = [];
    for (const item of items) {
      const res = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${item.prNumber}`, {
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
    
    return { repoFullName, items: prDetails };
  }
});

/**
 * Trigger processQueue manually.
 */
export const triggerProcessQueue = internalAction({
  args: { orgId: v.id("organizations"), repoId: v.id("connectedRepos") },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.mergeQueue.processQueue, {
      orgId: args.orgId,
      repoId: args.repoId,
    });
    return { success: true };
  }
});
