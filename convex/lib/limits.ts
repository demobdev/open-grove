import { Doc } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

/**
 * Free-tier caps. Pro/Enterprise are unlimited app-side; Clerk enforces
 * paid seat limits at invite time.
 */
export const FREE_PLAN_LIMITS = {
  seats: 3,
  projects: 2,
  issues: 100,
} as const;

/**
 * Agentic feature limits per plan.
 *
 * Philosophy: "Open Grove" — free tier is generous enough to demonstrate
 * value (3 skills, limited automation runs). The cost-heavy stuff (LLM calls
 * for loops, PR reviews, merge queue) gates at Pro/Enterprise where the
 * org is clearly getting production value and can justify the cost.
 */
export const AGENTIC_PLAN_LIMITS = {
  free: {
    skills: 3,
    apiKeys: 0,
    automations: 0,
    loops: 0,
    agentRunsPerDay: 0,
    externalApiAccess: false,
  },
  pro: {
    skills: 25,
    apiKeys: 5,
    automations: 10,
    loops: 5,
    agentRunsPerDay: 100,
    externalApiAccess: true,
  },
  enterprise: {
    skills: -1, // unlimited
    apiKeys: -1,
    automations: -1,
    loops: -1,
    agentRunsPerDay: -1,
    externalApiAccess: true,
  },
} as const;

export type AgenticLimits = (typeof AGENTIC_PLAN_LIMITS)[keyof typeof AGENTIC_PLAN_LIMITS];

/** Get the agentic limits for an org's current plan. */
export function agenticLimitsForPlan(org: Doc<"organizations">): AgenticLimits {
  return AGENTIC_PLAN_LIMITS[org.plan] ?? AGENTIC_PLAN_LIMITS.free;
}

/** Check if a limit value means "unlimited". */
function isUnlimited(limit: number): boolean {
  return limit < 0;
}

export function isPaidPlan(org: Doc<"organizations">): boolean {
  return org.plan === "pro" || org.plan === "enterprise";
}

export async function assertCanCreateSkill(
  ctx: MutationCtx,
  org: Doc<"organizations">
): Promise<void> {
  const limits = agenticLimitsForPlan(org);
  if (isUnlimited(limits.skills)) return;
  const skills = await ctx.db
    .query("skills")
    .withIndex("by_org", (q) => q.eq("orgId", org._id))
    .collect();
  if (skills.length >= limits.skills) {
    throw new Error(
      `Your plan allows up to ${limits.skills} skills. Upgrade to Pro for more, or Enterprise for unlimited.`
    );
  }
}

export async function assertCanCreateApiKey(
  ctx: MutationCtx,
  org: Doc<"organizations">
): Promise<void> {
  const limits = agenticLimitsForPlan(org);
  if (isUnlimited(limits.apiKeys)) return;
  if (limits.apiKeys === 0) {
    throw new Error(
      "API keys require a Pro plan. Upgrade to connect external agents like Cursor or Claude Code."
    );
  }
  const keys = await ctx.db
    .query("apiKeys")
    .withIndex("by_org", (q) => q.eq("orgId", org._id))
    .collect();
  const activeKeys = keys.filter((k) => !k.revokedAt);
  if (activeKeys.length >= limits.apiKeys) {
    throw new Error(
      `Your plan allows up to ${limits.apiKeys} API keys. Upgrade to Enterprise for unlimited.`
    );
  }
}

export async function assertCanCreateIssue(
  ctx: MutationCtx,
  org: Doc<"organizations">
): Promise<void> {
  if (isPaidPlan(org)) {
    return;
  }
  const issues = await ctx.db
    .query("issues")
    .withIndex("by_org", (q) => q.eq("orgId", org._id))
    .collect();
  if (issues.length >= FREE_PLAN_LIMITS.issues) {
    throw new Error(
      `Free plan is limited to ${FREE_PLAN_LIMITS.issues} issues. Upgrade to Pro for unlimited issues.`
    );
  }
}

export async function assertCanCreateProject(
  ctx: MutationCtx,
  org: Doc<"organizations">
): Promise<void> {
  if (isPaidPlan(org)) {
    return;
  }
  const projects = await ctx.db
    .query("projects")
    .withIndex("by_org", (q) => q.eq("orgId", org._id))
    .collect();
  if (projects.length >= FREE_PLAN_LIMITS.projects) {
    throw new Error(
      `Free plan is limited to ${FREE_PLAN_LIMITS.projects} projects. Upgrade to Pro for unlimited projects.`
    );
  }
}

export async function assertUnderSeatLimit(
  ctx: MutationCtx,
  org: Doc<"organizations">
): Promise<void> {
  if (isPaidPlan(org)) {
    return;
  }
  const members = await ctx.db
    .query("members")
    .withIndex("by_org", (q) => q.eq("orgId", org._id))
    .collect();
  if (members.length >= FREE_PLAN_LIMITS.seats) {
    throw new Error(
      `Free plan is limited to ${FREE_PLAN_LIMITS.seats} members. Upgrade to Pro for more seats.`
    );
  }
}

export function hasAiAccess(org: Doc<"organizations">): boolean {
  return isPaidPlan(org);
}

/** Whether this org can use the external Skills API. */
export function hasExternalApiAccess(org: Doc<"organizations">): boolean {
  return agenticLimitsForPlan(org).externalApiAccess;
}

export async function assertCanCreateAutomation(
  ctx: MutationCtx,
  org: Doc<"organizations">
): Promise<void> {
  const limits = agenticLimitsForPlan(org);
  if (isUnlimited(limits.automations)) return;
  if (limits.automations === 0) {
    throw new Error(
      "Automations require a Pro plan. Upgrade to automatically trigger agents on webhooks."
    );
  }
  const automations = await ctx.db
    .query("automations")
    .withIndex("by_org", (q) => q.eq("orgId", org._id))
    .collect();
  if (automations.length >= limits.automations) {
    throw new Error(
      `Your plan allows up to ${limits.automations} automations. Upgrade to Enterprise for unlimited.`
    );
  }
}

