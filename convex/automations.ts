import { v } from "convex/values";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertCanCreateAutomation } from "./lib/limits";
import { agentTriggerTypeValidator, executionModeValidator } from "./schema";
import { internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const listAutomations = orgQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("automations")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .collect();
  },
});

export const getAutomation = orgQuery({
  args: { automationId: v.id("automations") },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation || automation.orgId !== ctx.org._id) {
      return null;
    }
    return automation;
  },
});

export const createAutomation = orgMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: agentTriggerTypeValidator,
    triggerConfig: v.optional(v.string()),
    targetSkillId: v.optional(v.id("skills")),
    targetLoopId: v.optional(v.id("loops")),
    executionMode: executionModeValidator,
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertCanCreateAutomation(ctx, ctx.org);

    // Verify the target skill or loop belongs to the org
    if (args.targetSkillId) {
      const skill = await ctx.db.get(args.targetSkillId);
      if (!skill || skill.orgId !== ctx.org._id) {
        throw new Error("Invalid target skill");
      }
    }
    
    if (args.targetLoopId) {
      const loop = await ctx.db.get(args.targetLoopId);
      if (!loop || loop.orgId !== ctx.org._id) {
        throw new Error("Invalid target loop");
      }
    }

    if (!args.targetSkillId && !args.targetLoopId) {
      throw new Error("Must specify a target skill or loop");
    }

    const automationId = await ctx.db.insert("automations", {
      orgId: ctx.org._id,
      name: args.name,
      description: args.description,
      triggerType: args.triggerType,
      triggerConfig: args.triggerConfig,
      targetSkillId: args.targetSkillId,
      targetLoopId: args.targetLoopId,
      executionMode: args.executionMode,
      isEnabled: args.isEnabled,
      createdBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    return automationId;
  },
});

export const updateAutomation = orgMutation({
  args: {
    automationId: v.id("automations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerType: v.optional(agentTriggerTypeValidator),
    triggerConfig: v.optional(v.string()),
    targetSkillId: v.optional(v.id("skills")),
    targetLoopId: v.optional(v.id("loops")),
    executionMode: v.optional(executionModeValidator),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation || automation.orgId !== ctx.org._id) {
      throw new Error("Automation not found");
    }

    if (args.targetSkillId) {
      const skill = await ctx.db.get(args.targetSkillId);
      if (!skill || skill.orgId !== ctx.org._id) {
        throw new Error("Invalid target skill");
      }
    }

    if (args.targetLoopId) {
      const loop = await ctx.db.get(args.targetLoopId);
      if (!loop || loop.orgId !== ctx.org._id) {
        throw new Error("Invalid target loop");
      }
    }

    const { automationId, ...updates } = args;

    await ctx.db.patch(automationId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return automationId;
  },
});

export const deleteAutomation = orgMutation({
  args: { automationId: v.id("automations") },
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation || automation.orgId !== ctx.org._id) {
      throw new Error("Automation not found");
    }
    await ctx.db.delete(args.automationId);
  },
});

/**
 * Internal query to fetch active automations for a given trigger type.
 * This is used by webhook handlers (e.g. github.ts) to see if they should
 * spawn an agent run.
 */
export const internalGetActiveAutomationsByTrigger = internalQuery({
  args: { 
    orgId: v.id("organizations"),
    triggerType: agentTriggerTypeValidator,
  },
  handler: async (ctx, args) => {
    const automations = await ctx.db
      .query("automations")
      .withIndex("by_org_and_trigger", (q) => 
        q.eq("orgId", args.orgId).eq("triggerType", args.triggerType)
      )
      .collect();
    
    return automations.filter((a: any) => a.isEnabled);
  },
});

export const internalGetAutomation = internalQuery({
  args: { automationId: v.id("automations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.automationId);
  },
});

export const dispatchAutomation = internalAction({
  args: {
    automationId: v.id("automations"),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const automation = await ctx.runQuery(internal.automations.internalGetAutomation, {
      automationId: args.automationId,
    });
    if (!automation || !automation.isEnabled) return;

    if (automation.targetLoopId) {
      await ctx.runMutation(internal.agent.loopOrchestrator.startLoop, {
        orgId: automation.orgId,
        loopId: automation.targetLoopId,
      });
    } else if (automation.targetSkillId) {
      await ctx.runAction(internal.agent.automationsAgent.runSkillAction, {
        orgId: automation.orgId,
        automationId: automation._id,
        skillId: automation.targetSkillId,
        payload: args.payload,
        executionMode: automation.executionMode,
      });
    }
  },
});
export const internalGetAllOrgs = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const internalRunCronAutomations = internalAction({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.runQuery(internal.automations.internalGetAllOrgs, {});
    for (const org of orgs) {
      const activeAutomations = await ctx.runQuery(internal.automations.internalGetActiveAutomationsByTrigger, {
        orgId: org._id,
        triggerType: "cron",
      });
      for (const automation of activeAutomations) {
        await ctx.runAction(internal.automations.dispatchAutomation, {
          automationId: automation._id,
          payload: { trigger: "cron", timestamp: Date.now() },
        });
      }
    }
  },
});
