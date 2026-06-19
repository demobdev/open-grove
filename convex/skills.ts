import { v } from "convex/values";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertCanCreateSkill } from "./lib/limits";
import { skillTypeValidator } from "./schema";
import { internalQuery } from "./_generated/server";

export const listSkills = orgQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .collect();
  },
});

export const internalListActiveSkills = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    // In Convex, we filter isEnabled after the fact since we don't have an index on it
    return skills.filter(s => s.isEnabled).sort((a, b) => b.priority - a.priority);
  },
});

export const getSkill = orgQuery({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.skillId);
    if (!skill || skill.orgId !== ctx.org._id) {
      return null;
    }
    return skill;
  },
});

export const createSkill = orgMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: skillTypeValidator,
    scope: v.object({
      repoNames: v.optional(v.array(v.string())),
      teamIds: v.optional(v.array(v.id("teams"))),
      projectIds: v.optional(v.array(v.id("projects"))),
      fileGlobs: v.optional(v.array(v.string())),
    }),
    content: v.string(),
    qualityGates: v.optional(v.array(v.string())),
    priority: v.number(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await assertCanCreateSkill(ctx, ctx.org);

    // Ensure slug uniqueness
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("orgId", ctx.org._id).eq("slug", args.slug)
      )
      .first();

    if (existing) {
      throw new Error(`A skill with slug "${args.slug}" already exists.`);
    }

    const skillId = await ctx.db.insert("skills", {
      orgId: ctx.org._id,
      name: args.name,
      slug: args.slug,
      description: args.description,
      type: args.type,
      scope: args.scope,
      content: args.content,
      qualityGates: args.qualityGates,
      priority: args.priority,
      isEnabled: args.isEnabled,
      version: 1,
      createdBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    return skillId;
  },
});

export const updateSkill = orgMutation({
  args: {
    skillId: v.id("skills"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(skillTypeValidator),
    scope: v.optional(
      v.object({
        repoNames: v.optional(v.array(v.string())),
        teamIds: v.optional(v.array(v.id("teams"))),
        projectIds: v.optional(v.array(v.id("projects"))),
        fileGlobs: v.optional(v.array(v.string())),
      })
    ),
    content: v.optional(v.string()),
    qualityGates: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.skillId);
    if (!skill || skill.orgId !== ctx.org._id) {
      throw new Error("Skill not found");
    }

    if (args.slug && args.slug !== skill.slug) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_org_and_slug", (q) =>
          q.eq("orgId", ctx.org._id).eq("slug", args.slug!)
        )
        .first();
      if (existing) {
        throw new Error(`A skill with slug "${args.slug}" already exists.`);
      }
    }

    const { skillId, ...updates } = args;
    
    // Bump version if content changes
    const version = args.content && args.content !== skill.content 
      ? skill.version + 1 
      : skill.version;

    await ctx.db.patch(skillId, {
      ...updates,
      version,
      updatedAt: Date.now(),
    });

    return skillId;
  },
});

export const deleteSkill = orgMutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.skillId);
    if (!skill || skill.orgId !== ctx.org._id) {
      throw new Error("Skill not found");
    }
    await ctx.db.delete(args.skillId);
  },
});
