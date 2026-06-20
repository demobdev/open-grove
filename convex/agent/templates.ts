import { v } from "convex/values";
import { orgMutation } from "../lib/customFunctions";
import { hasAiAccess } from "../lib/limits";

const TEMPLATES = {
  "auto-triage": {
    name: "Auto-Triage",
    description: "Automatically analyzes new issues, applies the correct team tags, and assigns them to the appropriate developer.",
    actionSkill: {
      name: "Triage Assistant",
      slug: "triage-assistant",
      type: "triage" as const,
      content: "You are an expert project manager. When a new issue is created, read its title and description. Determine the most appropriate team, assign the priority (low, medium, high, urgent), and assign it to a developer if their area of expertise matches. Reply with your assignment logic.",
    },
    validationSkill: {
      name: "Triage Reviewer",
      slug: "triage-reviewer",
      type: "review" as const,
      content: "Review the assignment logic of the Triage Assistant. Ensure the priority makes sense for the severity of the issue and that a team has been correctly identified.",
    },
    maxIterations: 3,
  },
  "pr-reviewer": {
    name: "PR Code Reviewer",
    description: "Listens for GitHub PR webhooks, reads the code diff, checks against style guidelines, and posts a review comment.",
    actionSkill: {
      name: "Code Reviewer",
      slug: "code-reviewer",
      type: "review" as const,
      content: "You are a senior software engineer. Read the provided git diff. Check for security vulnerabilities, performance issues, and adherence to standard coding conventions. Provide specific, constructive feedback.",
    },
    validationSkill: {
      name: "Review Validator",
      slug: "review-validator",
      type: "review" as const,
      content: "Check the Code Reviewer's feedback. Ensure the tone is constructive and that no hallucinated code lines were referenced.",
    },
    maxIterations: 2,
  },
  "daily-standup": {
    name: "Daily Standup Summarizer",
    description: "Runs on a schedule to gather completed and in-progress work over the last 24 hours, generating a team update.",
    actionSkill: {
      name: "Standup Reporter",
      slug: "standup-reporter",
      type: "custom" as const,
      content: "Gather all issues that were moved to 'in_progress' or 'done' in the last 24 hours. Group them by team member and generate a bulleted standup report.",
    },
    validationSkill: {
      name: "Report Formatter",
      slug: "report-formatter",
      type: "review" as const,
      content: "Verify that the standup report includes only activity from the last 24 hours and is formatted cleanly using markdown.",
    },
    maxIterations: 2,
  }
};

export const installTemplate = orgMutation({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!hasAiAccess(ctx.org)) {
      throw new Error("The AI agent requires a Pro or Enterprise plan. Upgrade to unlock loops.");
    }
    
    const template = TEMPLATES[args.templateId as keyof typeof TEMPLATES];
    if (!template) {
      throw new Error("Template not found");
    }

    // Helper to insert skill if it doesn't exist
    const insertSkill = async (skillData: typeof template.actionSkill) => {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_org_and_slug", q => q.eq("orgId", ctx.org._id).eq("slug", skillData.slug))
        .first();
      
      if (existing) return existing._id;
      
      return await ctx.db.insert("skills", {
        orgId: ctx.org._id,
        name: skillData.name,
        slug: skillData.slug,
        type: skillData.type,
        scope: {},
        content: skillData.content,
        priority: 10,
        isEnabled: true,
        version: 1,
        createdBy: ctx.user._id,
        updatedAt: Date.now(),
      });
    };

    const actionSkillId = await insertSkill(template.actionSkill);
    const validationSkillId = await insertSkill(template.validationSkill);

    // Insert the loop
    const loopId = await ctx.db.insert("loops", {
      orgId: ctx.org._id,
      name: template.name,
      description: template.description,
      actionSkillId,
      validationSkillId,
      maxIterations: template.maxIterations,
      isEnabled: true,
      createdBy: ctx.user._id,
      updatedAt: Date.now(),
    });

    return { loopId };
  }
});
