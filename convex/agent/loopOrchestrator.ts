import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { vectorAgent, VECTOR_INSTRUCTIONS } from "./vectorAgent";
import { threadUserKey } from "./limiter";

/**
 * Starts a new execution of a Loop.
 * Initializes the loopRuns ledger and schedules the first iteration.
 */
export const startLoop = internalMutation({
  args: {
    orgId: v.id("organizations"),
    loopId: v.id("loops"),
  },
  handler: async (ctx, args) => {
    const loop = await ctx.db.get(args.loopId);
    if (!loop || loop.orgId !== args.orgId) throw new Error("Loop not found");

    const loopRunId = await ctx.db.insert("loopRuns", {
      orgId: args.orgId,
      loopId: args.loopId,
      status: "running",
      currentIteration: 1,
      maxIterations: loop.maxIterations,
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.agent.loopOrchestrator.executeLoopIteration, {
      orgId: args.orgId,
      loopRunId,
      feedbackContext: "",
    });

    return loopRunId;
  },
});

/**
 * The core recursive LLM orchestrator.
 * 1. Runs the Action Agent with the Action Skill.
 * 2. Runs the Validation Agent with the Validation Skill.
 * 3. Evaluates and recurses if needed.
 */
export const executeLoopIteration = internalAction({
  args: {
    orgId: v.id("organizations"),
    loopRunId: v.id("loopRuns"),
    feedbackContext: v.string(), // Feedback from previous validation failures
  },
  handler: async (ctx, args) => {
    // 1. Fetch Context
    const loopRun = await ctx.runQuery(internal.agent.loopOrchestrator.internalGetLoopRun, {
      loopRunId: args.loopRunId,
    });
    if (!loopRun || loopRun.status !== "running") return;

    const loop = await ctx.runQuery(internal.agent.loopOrchestrator.internalGetLoop, {
      loopId: loopRun.loopId,
    });
    if (!loop) return;

    const actionSkill = await ctx.runQuery(internal.agent.loopOrchestrator.internalGetSkill, {
      skillId: loop.actionSkillId,
    });
    const validationSkill = await ctx.runQuery(internal.agent.loopOrchestrator.internalGetSkill, {
      skillId: loop.validationSkillId,
    });

    if (!actionSkill || !validationSkill) {
      await ctx.runMutation(internal.agent.loopOrchestrator.internalUpdateLoopRunStatus, {
        loopRunId: args.loopRunId,
        status: "failed",
        error: "Missing action or validation skill",
      });
      return;
    }

    try {
      // 2. Action Phase
      // In a full implementation we'd spin up an agent and track it via agentRuns.
      // We will use the Vercel AI SDK embedded in vectorAgent or similar.
      // For V1 of the Orchestrator, we log the run and invoke the LLM.

      // Mocking the interaction for now:
      // const actionResult = await runActionAgent(actionSkill.content, args.feedbackContext);
      const actionResult = `[Action Execution Output] Simulated output based on ${actionSkill.slug}`;

      // 3. Validation Phase
      // We ask the Validation Agent to evaluate `actionResult` against `validationSkill.content`.
      // Expecting a structured JSON output {"passed": boolean, "feedback": string}
      
      // const validationResult = await runValidationAgent(validationSkill.content, actionResult);
      // Let's assume validation passes on iteration >= 2 just to simulate a loop.
      const validationPassed = loopRun.currentIteration >= 2;
      const validationFeedback = validationPassed ? "Looks good." : "Failed to meet criteria. Try again.";

      // 4. Evaluation
      if (validationPassed) {
        await ctx.runMutation(internal.agent.loopOrchestrator.internalUpdateLoopRunStatus, {
          loopRunId: args.loopRunId,
          status: "succeeded",
          resultSummary: `Succeeded after ${loopRun.currentIteration} iterations.\n\nValidation Feedback: ${validationFeedback}`,
        });
      } else {
        if (loopRun.currentIteration < loopRun.maxIterations) {
          // Increment iteration and recurse
          await ctx.runMutation(internal.agent.loopOrchestrator.internalIncrementIteration, {
            loopRunId: args.loopRunId,
          });
          
          await ctx.scheduler.runAfter(0, internal.agent.loopOrchestrator.executeLoopIteration, {
            orgId: args.orgId,
            loopRunId: args.loopRunId,
            feedbackContext: validationFeedback,
          });
        } else {
          // Max iterations reached
          await ctx.runMutation(internal.agent.loopOrchestrator.internalUpdateLoopRunStatus, {
            loopRunId: args.loopRunId,
            status: "failed",
            error: `Max iterations (${loopRun.maxIterations}) reached. Last feedback: ${validationFeedback}`,
          });
        }
      }
    } catch (e: any) {
      await ctx.runMutation(internal.agent.loopOrchestrator.internalUpdateLoopRunStatus, {
        loopRunId: args.loopRunId,
        status: "failed",
        error: e.message || "Unknown error",
      });
    }
  },
});

export const internalGetLoopRun = internalQuery({
  args: { loopRunId: v.id("loopRuns") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.loopRunId);
  },
});

export const internalGetLoop = internalQuery({
  args: { loopId: v.id("loops") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.loopId);
  },
});

export const internalGetSkill = internalQuery({
  args: { skillId: v.id("skills") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.skillId);
  },
});

export const internalUpdateLoopRunStatus = internalMutation({
  args: {
    loopRunId: v.id("loopRuns"),
    status: v.union(v.literal("running"), v.literal("succeeded"), v.literal("failed"), v.literal("stopped")),
    resultSummary: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.loopRunId, {
      status: args.status,
      completedAt: args.status !== "running" ? Date.now() : undefined,
      resultSummary: args.resultSummary,
      error: args.error,
    });
  },
});

export const internalIncrementIteration = internalMutation({
  args: { loopRunId: v.id("loopRuns") },
  handler: async (ctx, args) => {
    const loopRun = await ctx.db.get(args.loopRunId);
    if (!loopRun) return;
    await ctx.db.patch(args.loopRunId, {
      currentIteration: loopRun.currentIteration + 1,
    });
  },
});
