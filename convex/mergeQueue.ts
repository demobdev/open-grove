import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { mergeBatchStatusValidator, mergeQueueStatusValidator } from "./schema";

export const enqueuePR = orgMutation({
  args: {
    repoId: v.string(),
    prNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if PR is already in queue
    const existing = await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "queued")
      )
      .filter((q) => q.eq(q.field("prNumber"), args.prNumber))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("mergeQueueItems", {
      orgId: ctx.org._id,
      repoId: args.repoId,
      prNumber: args.prNumber,
      status: "queued",
      addedAt: Date.now(),
    });
  },
});

export const listQueue = orgQuery({
  args: { repoId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("asc")
      .collect();
    
    if (args.repoId) {
      return items.filter(item => item.repoId === args.repoId);
    }
    return items;
  },
});

export const listBatches = orgQuery({
  args: { repoId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("mergeBatches")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .collect();
      
    if (args.repoId) {
      return items.filter(item => item.repoId === args.repoId);
    }
    return items;
  },
});

export const internalSetQueueStatus = internalMutation({
  args: {
    itemId: v.id("mergeQueueItems"),
    status: mergeQueueStatusValidator,
    batchId: v.optional(v.id("mergeBatches")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      status: args.status,
      batchId: args.batchId,
      processedAt: Date.now(),
    });
  },
});

export const internalCreateBatch = internalMutation({
  args: {
    orgId: v.id("organizations"),
    repoId: v.string(),
    branchName: v.string(),
    prNumbers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mergeBatches", {
      orgId: args.orgId,
      repoId: args.repoId,
      branchName: args.branchName,
      prNumbers: args.prNumbers,
      status: "creating",
      createdAt: Date.now(),
    });
  },
});

export const internalUpdateBatchStatus = internalMutation({
  args: {
    batchId: v.id("mergeBatches"),
    status: mergeBatchStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.batchId, {
      status: args.status,
      completedAt: ["merged", "failed"].includes(args.status) ? Date.now() : undefined,
    });
  },
});

export const internalGetQueued = internalQuery({
  args: { orgId: v.id("organizations"), repoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "queued")
      )
      .filter(q => q.eq(q.field("orgId"), args.orgId))
      .collect();
  },
});

export const internalGetBatchByBranch = internalQuery({
  args: { orgId: v.id("organizations"), branchName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mergeBatches")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("branchName"), args.branchName))
      .first();
  },
});

export const handleBatchStatus = internalAction({
  args: {
    orgId: v.id("organizations"),
    repoId: v.string(),
    branchName: v.string(),
    status: v.string(), // "success" or "failure"
  },
  handler: async (ctx, args) => {
    const { internal } = await import("./_generated/api");
    
    const batch = await ctx.runQuery(internal.mergeQueue.internalGetBatchByBranch, {
      orgId: args.orgId,
      branchName: args.branchName,
    });
    
    if (!batch) return;
    if (batch.status !== "testing") return; // We only process tests

    if (args.status === "success") {
      // V1: manual approval required, mark as passed
      await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { 
        batchId: batch._id, 
        status: "passed" 
      });
      // The frontend will now show this batch as "ready to merge manually"
    } else if (args.status === "failure") {
      await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { 
        batchId: batch._id, 
        status: "failed" 
      });
      
      // Update the queue items to failed as well
      const items = await ctx.runQuery(internal.mergeQueue.internalGetItemsForBatch, {
        orgId: args.orgId,
        batchId: batch._id,
      });
      for (const item of items) {
        await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, { 
          itemId: item._id, 
          status: "failed", 
          batchId: batch._id 
        });
      }
    }
  }
});

export const internalGetItemsForBatch = internalQuery({
  args: { orgId: v.id("organizations"), batchId: v.id("mergeBatches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();
  },
});

export const processQueue = internalAction({
  args: { orgId: v.id("organizations"), repoId: v.string() },
  handler: async (ctx, args) => {
    const { internal } = await import("./_generated/api");
    const { getInstallationTokenForRepo } = await import("./agent/githubApp");

    // 1. Get queued PRs from DB
    const items = await ctx.runQuery(internal.mergeQueue.internalGetQueued, {
      orgId: args.orgId,
      repoId: args.repoId,
    });
    
    if (items.length === 0) return;

    // 2. Authenticate
    const token = await getInstallationTokenForRepo(args.repoId);

    // 3. For each PR, get list of changed files
    const prsWithFiles: { item: typeof items[0], files: string[] }[] = [];
    
    for (const item of items) {
      const res = await fetch(`https://api.github.com/repos/${args.repoId}/pulls/${item.prNumber}/files?per_page=100`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "User-Agent": "OpenGrove-Agent" }
      });
      if (res.ok) {
        const files = await res.json();
        prsWithFiles.push({ item, files: files.map((f: any) => f.filename) });
      }
    }

    // 4. Group by non-overlapping files (Deterministic file-overlap check for v1)
    const batches: typeof prsWithFiles[] = [];
    
    for (const pr of prsWithFiles) {
      let added = false;
      for (const batch of batches) {
        const batchFiles = new Set(batch.flatMap(b => b.files));
        const hasOverlap = pr.files.some(f => batchFiles.has(f));
        if (!hasOverlap) {
          batch.push(pr);
          added = true;
          break;
        }
      }
      if (!added) {
        batches.push([pr]);
      }
    }

    // 5. For each batch, create merge batch in DB and create integration branch
    for (const batch of batches) {
      const prNumbers = batch.map(b => b.item.prNumber);
      const branchName = `og-merge-batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const batchId = await ctx.runMutation(internal.mergeQueue.internalCreateBatch, {
        orgId: args.orgId,
        repoId: args.repoId,
        branchName,
        prNumbers,
      });

      for (const pr of batch) {
        await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, {
          itemId: pr.item._id,
          status: "batched",
          batchId,
        });
      }

      // Create branch off main
      const mainRes = await fetch(`https://api.github.com/repos/${args.repoId}/git/refs/heads/main`, {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent" }
      });
      if (!mainRes.ok) {
        await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "failed" });
        continue;
      }
      const mainData = await mainRes.json();
      
      const createBranchRes = await fetch(`https://api.github.com/repos/${args.repoId}/git/refs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent", "Content-Type": "application/json" },
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainData.object.sha })
      });
      
      if (!createBranchRes.ok) {
        await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "failed" });
        continue;
      }

      // Merge PR branches into integration branch
      let failed = false;
      for (const pr of batch) {
        const prRes = await fetch(`https://api.github.com/repos/${args.repoId}/pulls/${pr.item.prNumber}`, {
          headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent" }
        });
        const prData = await prRes.json();
        const headSha = prData.head.sha;

        const mergeRes = await fetch(`https://api.github.com/repos/${args.repoId}/merges`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent", "Content-Type": "application/json" },
          body: JSON.stringify({ base: branchName, head: headSha, commit_message: `Merge PR #${pr.item.prNumber} into integration branch` })
        });
        
        if (!mergeRes.ok && mergeRes.status !== 204 && mergeRes.status !== 201) { 
           failed = true;
           break;
        }
      }

      if (failed) {
        await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "failed" });
        for (const pr of batch) {
          await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, { itemId: pr.item._id, status: "failed", batchId });
        }
      } else {
        await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "testing" });
        for (const pr of batch) {
          await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, { itemId: pr.item._id, status: "testing", batchId });
        }
      }
    }
  }
});
