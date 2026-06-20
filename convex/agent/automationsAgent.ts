/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { generateText } from "ai";
import { chatModel } from "./models";

export const runSkillAction = internalAction({
  args: {
    orgId: v.id("organizations"),
    automationId: v.id("automations"),
    skillId: v.id("skills"),
    payload: v.any(),
    executionMode: v.union(v.literal("suggest_only"), v.literal("draft"), v.literal("auto_execute")),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.runQuery(internal.agent.automationsAgent.internalGetSkill, {
      skillId: args.skillId,
    });
    if (!skill) return;

    const runId = await ctx.runMutation(internal.agent.automationsAgent.internalCreateRun, {
      orgId: args.orgId,
      automationId: args.automationId,
      skillId: args.skillId,
      executionMode: args.executionMode,
    });

    try {
      const { text: result } = await generateText({
        model: chatModel,
        system: skill.content,
        prompt: `Execute the task for this incoming payload event:\n\n${JSON.stringify(args.payload, null, 2)}\n\nExecution mode is: ${args.executionMode}`,
      });

      await ctx.runMutation(internal.agent.automationsAgent.internalUpdateRun, {
        runId,
        status: "succeeded",
        summary: result,
      });
    } catch (error: any) {
      await ctx.runMutation(internal.agent.automationsAgent.internalUpdateRun, {
        runId,
        status: "failed",
        error: error.message || "Unknown error",
      });
    }
  },
});

export const internalGetSkill = internalQuery({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.skillId);
  },
});

export const internalCreateRun = internalMutation({
  args: {
    orgId: v.id("organizations"),
    automationId: v.id("automations"),
    skillId: v.id("skills"),
    executionMode: v.union(v.literal("suggest_only"), v.literal("draft"), v.literal("auto_execute")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentRuns", {
      orgId: args.orgId,
      status: "running",
      automationId: args.automationId,
      skillIds: [args.skillId],
      executionMode: args.executionMode,
      triggerType: "github_push", // Fallback, could be passed from automation
      startedAt: Date.now(),
    });
  },
});

export const internalUpdateRun = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    status: v.union(v.literal("running"), v.literal("succeeded"), v.literal("failed"), v.literal("queued"), v.literal("needs_approval"), v.literal("cancelled")),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: args.status,
      completedAt: args.status !== "running" ? Date.now() : undefined,
      summary: args.summary,
      error: args.error,
    });
  },
});
