import { v } from "convex/values";
import { orgQuery } from "./lib/customFunctions";
import { internalMutation } from "./_generated/server";
import {
  agentRunStatusValidator,
  agentTriggerTypeValidator,
  executionModeValidator,
} from "./schema";

export const listRuns = orgQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("agentRuns")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .take(limit);
  },
});

export const getRun = orgQuery({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.orgId !== ctx.org._id) {
      return null;
    }
    
    const steps = await ctx.db
      .query("agentRunSteps")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .order("asc")
      .collect();
      
    return { ...run, steps };
  },
});

// Internal mutations for the agent runtime to call as it executes

export const internalCreateRun = internalMutation({
  args: {
    orgId: v.id("organizations"),
    teamId: v.optional(v.id("teams")),
    issueId: v.optional(v.id("issues")),
    automationId: v.optional(v.id("automations")),
    loopId: v.optional(v.id("loops")),
    skillIds: v.array(v.id("skills")),
    triggerType: agentTriggerTypeValidator,
    executionMode: executionModeValidator,
    idempotencyKey: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("agentRuns")
        .withIndex("by_idempotency", (q) =>
          q.eq("orgId", args.orgId).eq("idempotencyKey", args.idempotencyKey!)
        )
        .first();
      if (existing) {
        return existing._id;
      }
    }

    return await ctx.db.insert("agentRuns", {
      orgId: args.orgId,
      teamId: args.teamId,
      issueId: args.issueId,
      automationId: args.automationId,
      loopId: args.loopId,
      skillIds: args.skillIds,
      triggerType: args.triggerType,
      executionMode: args.executionMode,
      status: "queued",
      idempotencyKey: args.idempotencyKey,
      createdByUserId: args.createdByUserId,
    });
  },
});

export const internalUpdateRunStatus = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    status: agentRunStatusValidator,
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, string | number | undefined> = { status: args.status };
    if (args.status === "running") {
      patch.startedAt = Date.now();
    } else if (
      ["succeeded", "failed", "cancelled", "needs_approval"].includes(args.status)
    ) {
      patch.completedAt = Date.now();
    }
    
    if (args.summary !== undefined) patch.summary = args.summary;
    if (args.error !== undefined) patch.error = args.error;

    await ctx.db.patch(args.runId, patch);
  },
});

export const internalAddRunStep = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    stepIndex: v.number(),
    toolName: v.string(),
    input: v.optional(v.string()),
    outputSummary: v.optional(v.string()),
    status: v.union(
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("skipped")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentRunSteps", {
      runId: args.runId,
      stepIndex: args.stepIndex,
      toolName: args.toolName,
      input: args.input,
      outputSummary: args.outputSummary,
      status: args.status,
      startedAt: Date.now(),
      completedAt: args.status !== "running" ? Date.now() : undefined,
      error: args.error,
    });
  },
});
