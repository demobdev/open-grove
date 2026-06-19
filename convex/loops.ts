import { v } from "convex/values";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertCanCreateAutomation } from "./lib/limits";

export const listLoops = orgQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("loops")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .collect();
  },
});

export const getLoop = orgQuery({
  args: { loopId: v.id("loops") },
  handler: async (ctx, args) => {
    const loop = await ctx.db.get(args.loopId);
    if (!loop || loop.orgId !== ctx.org._id) {
      return null;
    }
    return loop;
  },
});

export const createLoop = orgMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    actionSkillId: v.id("skills"),
    validationSkillId: v.id("skills"),
    maxIterations: v.number(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // We use the same limits as Automations for Loops for now
    await assertCanCreateAutomation(ctx, ctx.org);

    // Verify the skills belong to the org
    const actionSkill = await ctx.db.get(args.actionSkillId);
    if (!actionSkill || actionSkill.orgId !== ctx.org._id) {
      throw new Error("Invalid action skill");
    }

    const validationSkill = await ctx.db.get(args.validationSkillId);
    if (!validationSkill || validationSkill.orgId !== ctx.org._id) {
      throw new Error("Invalid validation skill");
    }

    const loopId = await ctx.db.insert("loops", {
      orgId: ctx.org._id,
      name: args.name,
      description: args.description,
      actionSkillId: args.actionSkillId,
      validationSkillId: args.validationSkillId,
      maxIterations: args.maxIterations,
      isEnabled: args.isEnabled,
      createdBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    return loopId;
  },
});

export const updateLoop = orgMutation({
  args: {
    loopId: v.id("loops"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    actionSkillId: v.optional(v.id("skills")),
    validationSkillId: v.optional(v.id("skills")),
    maxIterations: v.optional(v.number()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const loop = await ctx.db.get(args.loopId);
    if (!loop || loop.orgId !== ctx.org._id) {
      throw new Error("Loop not found");
    }

    if (args.actionSkillId) {
      const skill = await ctx.db.get(args.actionSkillId);
      if (!skill || skill.orgId !== ctx.org._id) {
        throw new Error("Invalid action skill");
      }
    }

    if (args.validationSkillId) {
      const skill = await ctx.db.get(args.validationSkillId);
      if (!skill || skill.orgId !== ctx.org._id) {
        throw new Error("Invalid validation skill");
      }
    }

    const { loopId, ...updates } = args;

    await ctx.db.patch(loopId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return loopId;
  },
});

export const deleteLoop = orgMutation({
  args: { loopId: v.id("loops") },
  handler: async (ctx, args) => {
    const loop = await ctx.db.get(args.loopId);
    if (!loop || loop.orgId !== ctx.org._id) {
      throw new Error("Loop not found");
    }
    await ctx.db.delete(args.loopId);
  },
});
