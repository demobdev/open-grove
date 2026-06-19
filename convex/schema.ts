import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Shared validators — import these from feature code instead of redefining.
 * The schema is FROZEN for parallel track work: coordinate before editing this file.
 */
export const issueStatusValidator = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done"),
  v.literal("canceled")
);

export const issuePriorityValidator = v.union(
  v.literal("none"),
  v.literal("urgent"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const planValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("enterprise")
);

export const memberRoleValidator = v.union(
  v.literal("admin"),
  v.literal("member")
);

export const projectStatusValidator = v.union(
  v.literal("backlog"),
  v.literal("planned"),
  v.literal("in_progress"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("canceled")
);

export const issueRelationTypeValidator = v.union(
  v.literal("blocks"),
  v.literal("blocked_by"),
  v.literal("related"),
  v.literal("duplicate_of")
);

// ── Agentic Execution Layer validators ───────────────────────────────────

export const skillTypeValidator = v.union(
  v.literal("triage"),
  v.literal("review"),
  v.literal("docs"),
  v.literal("security"),
  v.literal("style"),
  v.literal("release"),
  v.literal("custom")
);

export const agentTriggerTypeValidator = v.union(
  v.literal("manual"),
  v.literal("github_pr_opened"),
  v.literal("github_pr_merged"),
  v.literal("github_push"),
  v.literal("cron"),
  v.literal("issue_created"),
  v.literal("issue_status_changed")
);

export const executionModeValidator = v.union(
  v.literal("suggest_only"),
  v.literal("draft"),
  v.literal("auto_execute")
);

export const agentRunStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("needs_approval"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("cancelled")
);

export const aiSuggestionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("expired")
);

export const mergeQueueStatusValidator = v.union(
  v.literal("queued"),
  v.literal("batched"),
  v.literal("testing"),
  v.literal("merged"),
  v.literal("failed")
);

export const mergeBatchStatusValidator = v.union(
  v.literal("creating"),
  v.literal("testing"),
  v.literal("passed"),
  v.literal("failed"),
  v.literal("merged")
);

export const loopRunStatusValidator = v.union(
  v.literal("running"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("stopped")
);

export default defineSchema({
  // ── Synced from Clerk via webhooks ─────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    plan: planValidator,
    subscriptionStatus: v.optional(v.string()),
  })
    .index("by_clerk_org_id", ["clerkOrgId"])
    .index("by_slug", ["slug"]),

  members: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    role: memberRoleValidator,
    clerkMembershipId: v.string(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["orgId", "userId"])
    .index("by_clerk_membership_id", ["clerkMembershipId"]),

  // ── Workspace structure ────────────────────────────────────────────────
  teams: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    /** Issue prefix, e.g. "ENG" → ENG-123 */
    key: v.string(),
    description: v.optional(v.string()),
    /** Per-team issue number sequence */
    nextIssueNumber: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_key", ["orgId", "key"]),

  issues: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    /** Per-team sequence number, displayed as KEY-number */
    number: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    status: issueStatusValidator,
    priority: issuePriorityValidator,
    assigneeId: v.optional(v.id("users")),
    creatorId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    cycleId: v.optional(v.id("cycles")),
    parentIssueId: v.optional(v.id("issues")),
    estimate: v.optional(v.number()),
    /** Due date as ms since epoch */
    dueDate: v.optional(v.number()),
    /** Fractional ranking for board/list ordering */
    sortOrder: v.number(),
    /** Embedding for semantic duplicate detection (Track D fills this) */
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_org", ["orgId"])
    .index("by_team", ["teamId"])
    .index("by_team_and_number", ["teamId", "number"])
    .index("by_team_and_status", ["teamId", "status"])
    .index("by_assignee", ["orgId", "assigneeId"])
    .index("by_project", ["projectId"])
    .index("by_cycle", ["cycleId"])
    .index("by_parent", ["parentIssueId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId", "teamId"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["orgId", "teamId"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["orgId"],
    }),

  labels: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    /** Hex color, e.g. "#5e6ad2" */
    color: v.string(),
  }).index("by_org", ["orgId"]),

  issueLabels: defineTable({
    issueId: v.id("issues"),
    labelId: v.id("labels"),
  })
    .index("by_issue", ["issueId"])
    .index("by_label", ["labelId"]),

  issueRelations: defineTable({
    issueId: v.id("issues"),
    relatedIssueId: v.id("issues"),
    type: issueRelationTypeValidator,
  })
    .index("by_issue", ["issueId"])
    .index("by_related", ["relatedIssueId"]),

  comments: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    authorId: v.id("users"),
    body: v.string(),
    /** User ids @mentioned in the body */
    mentions: v.optional(v.array(v.id("users"))),
  }).index("by_issue", ["issueId"]),

  activity: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    actorId: v.id("users"),
    /** e.g. "created" | "status_changed" | "assigned" | "labeled" | "commented" */
    type: v.string(),
    field: v.optional(v.string()),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
  })
    .index("by_issue", ["issueId"])
    .index("by_org", ["orgId"]),

  projects: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    status: projectStatusValidator,
    leadId: v.optional(v.id("users")),
    /** Target date as ms since epoch */
    targetDate: v.optional(v.number()),
    color: v.optional(v.string()),
  }).index("by_org", ["orgId"]),

  cycles: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    /** Per-team cycle sequence: Cycle 1, Cycle 2, ... */
    number: v.number(),
    name: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_number", ["teamId", "number"]),

  attachments: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
  }).index("by_issue", ["issueId"]),

  views: defineTable({
    orgId: v.id("organizations"),
    creatorId: v.id("users"),
    name: v.string(),
    /** JSON-serialized filter configuration (owned by Track A) */
    filters: v.string(),
    shared: v.boolean(),
  })
    .index("by_org", ["orgId"])
    .index("by_creator", ["creatorId"]),

  connectedRepos: defineTable({
    orgId: v.id("organizations"),
    repoName: v.string(), // e.g. "owner/repo"
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_repo", ["repoName"]),

  // ── Agentic Execution Layer (Phase 1 & 2) ──────────────────────────────────

  /**
   * Automations — the "If This Then That" engine.
   * Maps an event trigger (e.g., github_pr_opened) to a target skill.
   */
  automations: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: agentTriggerTypeValidator,
    triggerConfig: v.optional(v.string()), // e.g. cron schedule
    targetSkillId: v.optional(v.id("skills")),
    targetLoopId: v.optional(v.id("loops")),
    executionMode: executionModeValidator,
    isEnabled: v.boolean(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_trigger", ["orgId", "triggerType"]),

  loops: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    actionSkillId: v.id("skills"),
    validationSkillId: v.id("skills"),
    maxIterations: v.number(),
    isEnabled: v.boolean(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_org", ["orgId"]),

  loopRuns: defineTable({
    orgId: v.id("organizations"),
    loopId: v.id("loops"),
    status: loopRunStatusValidator,
    currentIteration: v.number(),
    maxIterations: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_loop", ["loopId"])
    .index("by_org_and_status", ["orgId", "status"]),

  /**
   * Skills Registry — the "Org Brain".
   * Structured, scoped, versioned prompt templates and quality gates
   * that agents discover at runtime based on task context.
   */
  skills: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    /** URL-safe identifier, e.g. "auto-review-v1" */
    slug: v.string(),
    description: v.optional(v.string()),
    type: skillTypeValidator,
    /** Scope controls where this skill applies */
    scope: v.object({
      repoNames: v.optional(v.array(v.string())),
      teamIds: v.optional(v.array(v.id("teams"))),
      projectIds: v.optional(v.array(v.id("projects"))),
      fileGlobs: v.optional(v.array(v.string())),
    }),
    /** The actual prompt template / instructions content */
    content: v.string(),
    /** Quality gates — structured checks the agent must verify */
    qualityGates: v.optional(v.array(v.string())),
    /** Higher priority skills take precedence when multiple match */
    priority: v.number(),
    isEnabled: v.boolean(),
    version: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_slug", ["orgId", "slug"])
    .index("by_org_and_type", ["orgId", "type"]),

  /**
   * API Keys — secure external access for local agents (Cursor, Claude Code, etc.).
   * Keys are hashed; only the prefix is stored in cleartext for identification.
   */
  apiKeys: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    /** First 8 chars of the key for display, e.g. "og_abc123..." */
    prefix: v.string(),
    /** SHA-256 hash of the full key */
    keyHash: v.string(),
    scopes: v.array(v.string()),
    createdBy: v.id("users"),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_key_hash", ["keyHash"]),

  /**
   * Agent Runs — durable execution ledger.
   * Every automation, loop, and manual agent action is recorded here.
   * Powers the Loops Dashboard, debugging, auditability, billing, and trust.
   */
  agentRuns: defineTable({
    orgId: v.id("organizations"),
    teamId: v.optional(v.id("teams")),
    issueId: v.optional(v.id("issues")),
    automationId: v.optional(v.id("automations")),
    loopId: v.optional(v.id("loops")),
    loopRunId: v.optional(v.id("loopRuns")),
    skillIds: v.array(v.id("skills")),
    triggerType: agentTriggerTypeValidator,
    executionMode: executionModeValidator,
    status: agentRunStatusValidator,
    /** Idempotency key to prevent duplicate runs */
    idempotencyKey: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_idempotency", ["orgId", "idempotencyKey"]),

  /**
   * Agent Run Steps — step-level logging for each tool call in a run.
   * Shows what the agent did, in what order, and whether each step succeeded.
   */
  agentRunSteps: defineTable({
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
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_run", ["runId"]),

  /**
   * AI Suggestions — Phase 5 Semantic Github Sync
   */
  aiSuggestions: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    repoId: v.string(),
    prNumber: v.optional(v.number()),
    commitSha: v.optional(v.string()),
    confidence: v.number(),
    reason: v.string(),
    status: aiSuggestionStatusValidator,
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    deliveryId: v.optional(v.string()), // For idempotency
  })
    .index("by_org", ["orgId"])
    .index("by_issue", ["issueId"])
    .index("by_status", ["status"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_delivery", ["deliveryId"]),

  // ── Phase 6: Agentic Merge Queue ───────────────────────────────────────

  mergeBatches: defineTable({
    orgId: v.id("organizations"),
    repoId: v.string(), // "owner/repo"
    branchName: v.string(),
    prNumbers: v.array(v.number()),
    status: mergeBatchStatusValidator,
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_repo", ["repoId"])
    .index("by_org_and_status", ["orgId", "status"]),

  mergeQueueItems: defineTable({
    orgId: v.id("organizations"),
    repoId: v.string(), // "owner/repo"
    prNumber: v.number(),
    status: mergeQueueStatusValidator,
    batchId: v.optional(v.id("mergeBatches")),
    addedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_repo", ["repoId"])
    .index("by_repo_and_status", ["repoId", "status"])
    .index("by_batch", ["batchId"]),
});
