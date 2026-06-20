/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { mergeBatchStatusValidator, mergeQueueStatusValidator } from "./schema";

// ── QUEUEING ────────────────────────────────────────────────────────

export const enqueuePR = orgMutation({
  args: {
    repoId: v.id("connectedRepos"),
    prNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repo not found");
    if (repo.orgId !== ctx.org._id) throw new Error("Unauthorized");

    const idempotencyKey = `${ctx.org._id}-${args.repoId}-${args.prNumber}`;

    const existing = await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", idempotencyKey))
      .first();

    if (existing) {
      if (existing.status === "failed" || existing.status === "cancelled") {
        await ctx.db.patch(existing._id, { status: "queued", batchId: undefined });
        await ctx.scheduler.runAfter(0, internal.mergeQueue.fetchPRMetadata, { 
          itemId: existing._id, 
          repoName: repo.repoName, 
          prNumber: args.prNumber 
        });
      }
      return existing._id;
    }

    const itemId = await ctx.db.insert("mergeQueueItems", {
      orgId: ctx.org._id,
      repoId: args.repoId,
      repoFullName: repo.repoName,
      targetBranch: "", 
      prNumber: args.prNumber,
      
      baseBranch: "",
      headBranch: "",
      headSha: "",
      changedFiles: [],

      status: "queued",
      idempotencyKey,
      addedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.mergeQueue.fetchPRMetadata, { 
      itemId, 
      repoName: repo.repoName, 
      prNumber: args.prNumber 
    });

    return itemId;
  },
});

export const internalUpdateItemMetadata = internalMutation({
  args: {
    itemId: v.id("mergeQueueItems"),
    baseBranch: v.string(),
    headBranch: v.string(),
    headSha: v.string(),
    changedFiles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      baseBranch: args.baseBranch,
      targetBranch: args.baseBranch, // Sync targetBranch
      headBranch: args.headBranch,
      headSha: args.headSha,
      changedFiles: args.changedFiles,
    });
  }
});

export const fetchPRMetadata = internalAction({
  args: {
    itemId: v.id("mergeQueueItems"),
    repoName: v.string(),
    prNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { internal } = await import("./_generated/api");
    const { getInstallationTokenForRepo } = await import("./agent/githubApp");

    const token = await getInstallationTokenForRepo(args.repoName);

    const prRes = await fetch(`https://api.github.com/repos/${args.repoName}/pulls/${args.prNumber}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "User-Agent": "OpenGrove-Agent" }
    });
    if (!prRes.ok) return;
    const prData = await prRes.json();

    const filesRes = await fetch(`https://api.github.com/repos/${args.repoName}/pulls/${args.prNumber}/files?per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "User-Agent": "OpenGrove-Agent" }
    });
    if (!filesRes.ok) return;
    const filesData = await filesRes.json();

    await ctx.runMutation(internal.mergeQueue.internalUpdateItemMetadata, {
      itemId: args.itemId,
      baseBranch: prData.base.ref,
      headBranch: prData.head.ref,
      headSha: prData.head.sha,
      changedFiles: filesData.map((f: any) => f.filename),
    });
  }
});

// ── QUERIES ────────────────────────────────────────────────────────

export const listQueue = orgQuery({
  args: { repoId: v.optional(v.id("connectedRepos")) },
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
  args: { repoId: v.optional(v.id("connectedRepos")) },
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

// ── BATCH PROCESSING ────────────────────────────────────────────────

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
    repoId: v.id("connectedRepos"),
    repoFullName: v.string(),
    targetBranch: v.string(),
    branchName: v.string(),
    prNumbers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const sortedPrs = [...args.prNumbers].sort((a, b) => a - b);
    const idempotencyKey = `${args.orgId}-${args.repoId}-${sortedPrs.join("-")}`;

    return await ctx.db.insert("mergeBatches", {
      orgId: args.orgId,
      repoId: args.repoId,
      repoFullName: args.repoFullName,
      targetBranch: args.targetBranch,
      branchName: args.branchName,
      prNumbers: args.prNumbers,
      status: "creating",
      ciStatus: "pending",
      idempotencyKey,
      createdAt: Date.now(),
    });
  },
});

export const internalUpdateBatchStatus = internalMutation({
  args: {
    batchId: v.id("mergeBatches"),
    status: v.optional(mergeBatchStatusValidator),
    ciStatus: v.optional(v.union(v.literal("pending"), v.literal("success"), v.literal("failure"), v.literal("cancelled"), v.literal("unknown"))),
    ciRunUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.status) {
      updates.status = args.status;
      if (["merged", "failed", "cancelled"].includes(args.status)) {
        updates.completedAt = Date.now();
      }
    }
    if (args.ciStatus) {
      updates.ciStatus = args.ciStatus;
      updates.lastCheckedAt = Date.now();
    }
    if (args.ciRunUrl) {
      updates.ciRunUrl = args.ciRunUrl;
    }
    await ctx.db.patch(args.batchId, updates);
  },
});

export const internalGetQueued = internalQuery({
  args: { orgId: v.id("organizations"), repoId: v.id("connectedRepos") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "queued")
      )
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter(q => q.eq(q.field("orgId"), args.orgId))
      .collect();
      
    // Only return items that have their metadata fetched
    return items.filter(i => i.baseBranch !== "");
  },
});

export const internalGetBatchByBranch = internalQuery({
  args: { orgId: v.id("organizations"), branchName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mergeBatches")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) => q.eq(q.field("branchName"), args.branchName))
      .first();
  },
});

export const handleBatchStatus = internalAction({
  args: {
    orgId: v.id("organizations"),
    repoFullName: v.string(),
    branchName: v.string(),
    ciStatus: v.string(), // "success" | "failure" | "cancelled"
    ciRunUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { internal } = await import("./_generated/api");
    
    const batch = await ctx.runQuery(internal.mergeQueue.internalGetBatchByBranch, {
      orgId: args.orgId,
      branchName: args.branchName,
    });
    
    if (!batch) return;
    if (batch.status !== "testing") return; // We only process tests

    const ciStatusMapped = args.ciStatus as "success" | "failure" | "cancelled";

    if (ciStatusMapped === "success") {
      // V1: manual approval required
      await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { 
        batchId: batch._id, 
        status: "awaiting_approval",
        ciStatus: "success",
        ciRunUrl: args.ciRunUrl
      });
    } else if (ciStatusMapped === "failure" || ciStatusMapped === "cancelled") {
      await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { 
        batchId: batch._id, 
        status: ciStatusMapped === "failure" ? "failed" : "cancelled",
        ciStatus: ciStatusMapped,
        ciRunUrl: args.ciRunUrl
      });
      
      const items = await ctx.runQuery(internal.mergeQueue.internalGetItemsForBatch, {
        orgId: args.orgId,
        batchId: batch._id,
      });
      for (const item of items) {
        await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, { 
          itemId: item._id, 
          status: ciStatusMapped === "failure" ? "failed" : "cancelled", 
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
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();
  },
});

export const processQueue = internalAction({
  args: { orgId: v.id("organizations"), repoId: v.id("connectedRepos") },
  handler: async (ctx, args) => {
    const { internal } = await import("./_generated/api");
    const { getInstallationTokenForRepo } = await import("./agent/githubApp");

    const items = await ctx.runQuery(internal.mergeQueue.internalGetQueued, {
      orgId: args.orgId,
      repoId: args.repoId,
    });
    
    if (items.length === 0) return;

    // Group by targetBranch first, since we can only merge PRs targeting the same base
    const byTarget: Record<string, typeof items> = {};
    for (const item of items) {
      if (!byTarget[item.targetBranch]) byTarget[item.targetBranch] = [];
      byTarget[item.targetBranch].push(item);
    }

    const repoFullName = items[0].repoFullName;
    const token = await getInstallationTokenForRepo(repoFullName);

    // Process each target branch group
    for (const [targetBranch, groupItems] of Object.entries(byTarget)) {
      
      // Group by non-overlapping files (Deterministic file-overlap check for v1)
      const batches: typeof groupItems[] = [];
      
      for (const pr of groupItems) {
        let added = false;
        for (const batch of batches) {
          const batchFiles = new Set(batch.flatMap(b => b.changedFiles));
          const hasOverlap = pr.changedFiles.some(f => batchFiles.has(f));
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

      // For each batch, create merge batch in DB and create integration branch
      for (const batch of batches) {
        const prNumbers = batch.map(b => b.prNumber);
        const branchName = `og-merge-batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const batchId = await ctx.runMutation(internal.mergeQueue.internalCreateBatch, {
          orgId: args.orgId,
          repoId: args.repoId,
          repoFullName,
          targetBranch,
          branchName,
          prNumbers,
        });

        for (const pr of batch) {
          await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, {
            itemId: pr._id,
            status: "batched",
            batchId,
          });
        }

        // Create branch off targetBranch
        const targetRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${targetBranch}`, {
          headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent" }
        });
        if (!targetRes.ok) {
          await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "failed", ciStatus: "failure" });
          continue;
        }
        const targetData = await targetRes.json();
        
        const createBranchRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent", "Content-Type": "application/json" },
          body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: targetData.object.sha })
        });
        
        if (!createBranchRes.ok) {
          await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "failed", ciStatus: "failure" });
          continue;
        }

        // Merge PR branches into integration branch
        let failed = false;
        for (const pr of batch) {
          const mergeRes = await fetch(`https://api.github.com/repos/${repoFullName}/merges`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "User-Agent": "OpenGrove-Agent", "Content-Type": "application/json" },
            body: JSON.stringify({ base: branchName, head: pr.headSha, commit_message: `Merge PR #${pr.prNumber} into integration branch` })
          });
          
          if (!mergeRes.ok && mergeRes.status !== 204 && mergeRes.status !== 201) { 
             failed = true;
             break;
          }
        }

        if (failed) {
          await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "failed", ciStatus: "failure" });
          for (const pr of batch) {
            await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, { itemId: pr._id, status: "failed", batchId });
          }
        } else {
          await ctx.runMutation(internal.mergeQueue.internalUpdateBatchStatus, { batchId, status: "testing", ciStatus: "pending" });
          for (const pr of batch) {
            await ctx.runMutation(internal.mergeQueue.internalSetQueueStatus, { itemId: pr._id, status: "testing", batchId });
          }
        }
      }
    }
  }
});

// ── MANUAL BATCH OPERATIONS (Phase 6 additions) ─────────────────────

export const approveBatch = orgMutation({
  args: { batchId: v.id("mergeBatches") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.orgId !== ctx.org._id || batch.status !== "awaiting_approval") {
      throw new Error("Invalid batch or not in awaiting_approval state");
    }

    await ctx.db.patch(batch._id, {
      status: "approved",
      approvedBy: ctx.user._id,
      approvedAt: Date.now(),
    });
  }
});

export const cancelBatch = orgMutation({
  args: { batchId: v.id("mergeBatches") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.orgId !== ctx.org._id) {
      throw new Error("Invalid batch");
    }

    await ctx.db.patch(batch._id, {
      status: "cancelled",
      completedAt: Date.now(),
    });

    // Also cancel queue items
    const items = await ctx.db
      .query("mergeQueueItems")
      .withIndex("by_batch", (q) => q.eq("batchId", batch._id))
      .collect();
      
    for (const item of items) {
      await ctx.db.patch(item._id, { status: "cancelled", processedAt: Date.now() });
    }
  }
});

export const mergeBatch = orgMutation({
  args: { batchId: v.id("mergeBatches") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.orgId !== ctx.org._id || batch.status !== "approved") {
      throw new Error("Invalid batch or not in approved state");
    }
    
    await ctx.scheduler.runAfter(0, internal.mergeQueue.performMergeBatch, { 
      batchId: batch._id,
      userId: ctx.user._id,
    });
  }
});

export const performMergeBatch = internalAction({
  args: { batchId: v.id("mergeBatches"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const { internal } = await import("./_generated/api");
    const { getInstallationTokenForRepo } = await import("./agent/githubApp");
    
    const batch = await ctx.runQuery(internal.mergeQueue.internalGetBatch, { batchId: args.batchId });
    if (!batch) return;

    const token = await getInstallationTokenForRepo(batch.repoFullName);

    let failed = false;
    for (const prNum of batch.prNumbers) {
      const mergeRes = await fetch(`https://api.github.com/repos/${batch.repoFullName}/pulls/${prNum}/merge`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "User-Agent": "OpenGrove-Agent" },
        body: JSON.stringify({ commit_title: `Merge PR #${prNum} (Approved Batch)` })
      });
      if (!mergeRes.ok) failed = true;
    }

    await ctx.runMutation(internal.mergeQueue.internalMarkBatchMerged, { 
      batchId: batch._id, 
      userId: args.userId,
      failed 
    });
  }
});

export const internalGetBatch = internalQuery({
  args: { batchId: v.id("mergeBatches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.batchId);
  }
});

export const internalMarkBatchMerged = internalMutation({
  args: { batchId: v.id("mergeBatches"), userId: v.id("users"), failed: v.boolean() },
  handler: async (ctx, args) => {
    if (args.failed) {
      await ctx.db.patch(args.batchId, { status: "failed", completedAt: Date.now() });
    } else {
      await ctx.db.patch(args.batchId, { 
        status: "merged", 
        mergedBy: args.userId, 
        mergedAt: Date.now(),
        completedAt: Date.now()
      });
      
      const items = await ctx.db
        .query("mergeQueueItems")
        .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
        .collect();
      
      for (const item of items) {
        await ctx.db.patch(item._id, { status: "merged", processedAt: Date.now() });
      }
    }
  }
});
