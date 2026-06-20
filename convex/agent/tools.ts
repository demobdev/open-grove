import { createTool, type ToolCtx } from "@convex-dev/agent";
import { jsonSchema, generateText } from "ai";
import { chatModel } from "./models";
import { Infer } from "convex/values";
import { internal } from "../_generated/api";
import { DataModel, Id } from "../_generated/dataModel";
import { issueSummaryValidator } from "./data";
import { embedText } from "./embeddings";

/**
 * Org-scoped tools for the Vector agent.
 *
 * SECURITY: every tool reads `orgId` / `requestUserId` from the custom action
 * context that our own internal action injects after authenticating the
 * caller. The model can never choose which org it operates on — tool inputs
 * only carry user-meaningful identifiers (team keys, issue numbers, emails)
 * that are resolved inside the caller's org.
 *
 * NOTE: `execute` return types are annotated explicitly to avoid a type cycle
 * through `internal` → `_generated/api` → this module.
 */
export type VectorToolCtx = ToolCtx<DataModel> & {
  orgId: Id<"organizations">;
  requestUserId: Id<"users">;
};

type IssueSummary = Infer<typeof issueSummaryValidator>;

const ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "canceled",
] as const;
const ISSUE_PRIORITIES = ["none", "urgent", "high", "medium", "low"] as const;

type IssueStatus = (typeof ISSUE_STATUSES)[number];
type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

const emptyInput = jsonSchema<Record<string, never>>({
  type: "object",
  properties: {},
  additionalProperties: false,
});

const listTeams = createTool({
  description:
    "List the teams in this workspace with their issue-prefix keys (e.g. ENG). Use a team key whenever another tool needs one.",
  inputSchema: emptyInput,
  execute: async (
    ctx: VectorToolCtx
  ): Promise<
    Array<{ teamId: Id<"teams">; name: string; key: string; issueCount: number }>
  > => {
    return await ctx.runQuery(internal.agent.data.listTeamsForOrg, {
      orgId: ctx.orgId,
    });
  },
});

const listMembers = createTool({
  description:
    "List the members of this workspace with their names, emails and roles. Use emails when assigning issues.",
  inputSchema: emptyInput,
  execute: async (
    ctx: VectorToolCtx
  ): Promise<Array<{ name: string; email: string; role: string }>> => {
    return await ctx.runQuery(internal.agent.data.listMembersForOrg, {
      orgId: ctx.orgId,
    });
  },
});

const projectStatus = createTool({
  description:
    "Get the status of every project in the workspace: progress counts, lead and target date.",
  inputSchema: emptyInput,
  execute: async (
    ctx: VectorToolCtx
  ): Promise<
    Array<{
      name: string;
      status: string;
      leadName: string | null;
      targetDate: string | null;
      totalIssues: number;
      doneIssues: number;
      inProgressIssues: number;
    }>
  > => {
    return await ctx.runQuery(internal.agent.data.listProjectStatus, {
      orgId: ctx.orgId,
    });
  },
});

const searchIssues = createTool({
  description:
    "Full-text search issues by title in this workspace. Optionally restrict to one team by key.",
  inputSchema: jsonSchema<{ query: string; teamKey?: string }>({
    type: "object",
    properties: {
      query: { type: "string", description: "Search terms for issue titles" },
      teamKey: {
        type: "string",
        description: "Optional team key, e.g. ENG, to limit the search",
      },
    },
    required: ["query"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<IssueSummary[]> => {
    return await ctx.runQuery(internal.agent.data.searchIssues, {
      orgId: ctx.orgId,
      query: input.query,
      teamKey: input.teamKey,
    });
  },
});

const findSimilarIssues = createTool({
  description:
    "Semantic search: find issues whose meaning is similar to the given text. Best for detecting duplicates before creating a new issue.",
  inputSchema: jsonSchema<{ text: string }>({
    type: "object",
    properties: {
      text: {
        type: "string",
        description:
          "Issue title and/or description to find semantically similar issues for",
      },
    },
    required: ["text"],
    additionalProperties: false,
  }),
  execute: async (
    ctx: VectorToolCtx,
    input
  ): Promise<Array<IssueSummary & { similarity: number }>> => {
    const embedding = await embedText(input.text);
    const results = await ctx.vectorSearch("issues", "by_embedding", {
      vector: embedding,
      limit: 8,
      filter: (q) => q.eq("orgId", ctx.orgId),
    });
    const summaries: IssueSummary[] = await ctx.runQuery(
      internal.agent.data.issueSummariesByIds,
      { orgId: ctx.orgId, issueIds: results.map((r) => r._id) }
    );
    const scores = new Map(results.map((r) => [r._id, r._score]));
    return summaries
      .map((summary) => ({
        ...summary,
        similarity: Math.round((scores.get(summary.issueId) ?? 0) * 100) / 100,
      }))
      .filter((summary) => summary.similarity >= 0.35);
  },
});

const createIssue = createTool({
  description:
    "Create a new issue in a team. Returns the new issue's identifier (e.g. ENG-42). Check for duplicates with findSimilarIssues first when it makes sense.",
  inputSchema: jsonSchema<{
    teamKey: string;
    title: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeEmail?: string;
  }>({
    type: "object",
    properties: {
      teamKey: { type: "string", description: "Team key, e.g. ENG" },
      title: { type: "string", description: "Short, specific issue title" },
      description: {
        type: "string",
        description: "Optional longer description in plain text",
      },
      status: {
        type: "string",
        enum: [...ISSUE_STATUSES],
        description: "Initial status (defaults to todo)",
      },
      priority: {
        type: "string",
        enum: [...ISSUE_PRIORITIES],
        description: "Priority (defaults to none)",
      },
      assigneeEmail: {
        type: "string",
        description: "Email of the workspace member to assign",
      },
    },
    required: ["teamKey", "title"],
    additionalProperties: false,
  }),
  execute: async (
    ctx: VectorToolCtx,
    input
  ): Promise<{ issueId: Id<"issues">; identifier: string }> => {
    return await ctx.runMutation(internal.agent.data.createIssueForAgent, {
      orgId: ctx.orgId,
      actorUserId: ctx.requestUserId,
      teamKey: input.teamKey,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeEmail: input.assigneeEmail,
    });
  },
});

const updateIssue = createTool({
  description:
    "Update an existing issue referenced by its identifier (e.g. ENG-42). Only pass the fields you want to change. Pass assigneeEmail: null to unassign.",
  inputSchema: jsonSchema<{
    identifier: string;
    title?: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeEmail?: string | null;
  }>({
    type: "object",
    properties: {
      identifier: {
        type: "string",
        description: "Issue identifier like ENG-42",
      },
      title: { type: "string" },
      description: { type: "string" },
      status: { type: "string", enum: [...ISSUE_STATUSES] },
      priority: { type: "string", enum: [...ISSUE_PRIORITIES] },
      assigneeEmail: {
        type: ["string", "null"],
        description: "Member email to assign, or null to unassign",
      },
    },
    required: ["identifier"],
    additionalProperties: false,
  }),
  execute: async (
    ctx: VectorToolCtx,
    input
  ): Promise<{ identifier: string; changedFields: string[] }> => {
    const match = input.identifier
      .trim()
      .match(/^([A-Za-z][A-Za-z0-9]{0,4})-(\d+)$/);
    if (!match) {
      throw new Error(
        `"${input.identifier}" is not a valid issue identifier. Use the form KEY-number, e.g. ENG-42.`
      );
    }
    return await ctx.runMutation(internal.agent.data.updateIssueForAgent, {
      orgId: ctx.orgId,
      actorUserId: ctx.requestUserId,
      teamKey: match[1],
      number: Number(match[2]),
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeEmail: input.assigneeEmail,
    });
  },
});

type CycleSummary = {
  teamName: string;
  teamKey: string;
  cycle: {
    name: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  } | null;
  counts: {
    total: number;
    done: number;
    inProgress: number;
    inReview: number;
    todo: number;
    backlog: number;
    canceled: number;
  };
  issues: IssueSummary[];
};

const cycleSummary = createTool({
  description:
    "Summarize a team's current cycle (sprint): dates, days remaining, progress counts and the issues in it.",
  inputSchema: jsonSchema<{ teamKey: string }>({
    type: "object",
    properties: {
      teamKey: { type: "string", description: "Team key, e.g. ENG" },
    },
    required: ["teamKey"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<CycleSummary> => {
    return await ctx.runQuery(internal.agent.data.cycleSummaryForTeam, {
      orgId: ctx.orgId,
      teamKey: input.teamKey,
    });
  },
});

type StandupData = {
  sinceHours: number;
  entries: Array<{
    memberName: string;
    inProgress: IssueSummary[];
    completed: IssueSummary[];
    created: IssueSummary[];
  }>;
};

const standupReport = createTool({
  description:
    "Gather standup data: what each member completed and created recently, plus what they have in progress. Optionally restrict to a team.",
  inputSchema: jsonSchema<{ teamKey?: string; sinceHours?: number }>({
    type: "object",
    properties: {
      teamKey: {
        type: "string",
        description: "Optional team key to restrict the report to",
      },
      sinceHours: {
        type: "number",
        description: "Look-back window in hours (default 24, max 168)",
      },
    },
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<StandupData> => {
    const sinceHours = Math.min(Math.max(input.sinceHours ?? 24, 1), 168);
    return await ctx.runQuery(internal.agent.data.standupForOrg, {
      orgId: ctx.orgId,
      teamKey: input.teamKey,
      sinceHours,
    });
  },
});

// Secure helper to fetch the short-lived GitHub OAuth access token from Clerk
async function getGithubToken(ctx: VectorToolCtx): Promise<string> {
  const clerkUserId = await ctx.runQuery(internal.agent.data.getClerkIdForUserOrOrg, {
    orgId: ctx.orgId,
    userId: ctx.requestUserId || undefined,
  });

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured on the Convex deployment");
  }

  const clerkUrl = `https://api.clerk.com/v1/users/${clerkUserId.clerkUserId}/oauth_access_tokens/github`;
  const clerkResponse = await fetch(clerkUrl, {
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
    },
  });

  if (!clerkResponse.ok) {
    throw new Error(`Clerk OAuth token fetch failed: ${await clerkResponse.text()}`);
  }

  const tokens = await clerkResponse.json();
  if (!Array.isArray(tokens) || tokens.length === 0 || !tokens[0].token) {
    throw new Error("GitHub account is not connected for this user/workspace. Please connect GitHub in Integrations settings.");
  }

  return tokens[0].token;
}

// Secure helper to ensure the target repository is actually connected to the organization
async function assertRepoConnected(ctx: VectorToolCtx, repoName: string): Promise<void> {
  const isConnected = await ctx.runQuery(internal.agent.data.isRepoConnected, {
    orgId: ctx.orgId,
    repoName,
  });
  if (!isConnected) {
    throw new Error(`Repository "${repoName}" is not connected to this organization.`);
  }
}

interface GithubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

interface GithubSearchItem {
  path: string;
  name: string;
  html_url: string;
}

interface GithubCommitInfo {
  commit?: {
    message?: string;
  };
}

const fetchPRDiff = createTool({
  description: "Fetch the raw git diff of a GitHub pull request to see what code changes are proposed.",
  inputSchema: jsonSchema<{ repoName: string; prNumber: number }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "The full name of the repository (e.g. owner/repo)" },
      prNumber: { type: "number", description: "The Pull Request number" },
    },
    required: ["repoName", "prNumber"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<string> => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);
    const url = `https://api.github.com/repos/${input.repoName}/pulls/${input.prNumber}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch PR diff: ${response.statusText}`);
    }
    return await response.text();
  },
});

const fetchChangedFiles = createTool({
  description: "Get the list of changed files in a GitHub pull request, including addition and deletion counts.",
  inputSchema: jsonSchema<{ repoName: string; prNumber: number }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "Repository full name, e.g. owner/repo" },
      prNumber: { type: "number", description: "The Pull Request number" },
    },
    required: ["repoName", "prNumber"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>> => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);
    const url = `https://api.github.com/repos/${input.repoName}/pulls/${input.prNumber}/files`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch changed files: ${response.statusText}`);
    }
    const files = await response.json() as GithubFile[];
    if (!Array.isArray(files)) {
      throw new Error("Invalid response format from GitHub");
    }
    return files.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
    }));
  },
});

const fetchFileContent = createTool({
  description: "Fetch the content of a specific file in a GitHub repository.",
  inputSchema: jsonSchema<{ repoName: string; path: string; ref?: string }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "Repository full name, e.g. owner/repo" },
      path: { type: "string", description: "The path to the file from the repo root" },
      ref: { type: "string", description: "Optional git reference (branch, tag, or commit hash)" },
    },
    required: ["repoName", "path"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<string> => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);
    let url = `https://api.github.com/repos/${input.repoName}/contents/${input.path}`;
    if (input.ref) {
      url += `?ref=${encodeURIComponent(input.ref)}`;
    }
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.encoding === "base64" && data.content) {
      return atob(data.content.replace(/\s/g, ""));
    }
    return typeof data.content === "string" ? data.content : JSON.stringify(data);
  },
});

const searchRepoCode = createTool({
  description: "Search for code strings or patterns inside a connected GitHub repository.",
  inputSchema: jsonSchema<{ repoName: string; query: string }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "Repository full name, e.g. owner/repo" },
      query: { type: "string", description: "The search query (GitHub search query syntax)" },
    },
    required: ["repoName", "query"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<Array<{
    path: string;
    name: string;
    htmlUrl: string;
  }>> => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(input.query + ` repo:${input.repoName}`)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to search repo code: ${response.statusText}`);
    }
    const data = await response.json();
    const items = (data.items || []) as GithubSearchItem[];
    return items.map((item) => ({
      path: item.path,
      name: item.name,
      htmlUrl: item.html_url,
    }));
  },
});

const mapPRToIssues = createTool({
  description: "Extract issue keys (e.g., ENG-123) from a GitHub PR (title, body, commits) and return matching issue summaries from the workspace database.",
  inputSchema: jsonSchema<{ repoName: string; prNumber: number }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "Repository full name, e.g. owner/repo" },
      prNumber: { type: "number", description: "The Pull Request number" },
    },
    required: ["repoName", "prNumber"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<IssueSummary[]> => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);
    
    // 1. Fetch PR details
    const prUrl = `https://api.github.com/repos/${input.repoName}/pulls/${input.prNumber}`;
    const prResponse = await fetch(prUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (!prResponse.ok) {
      throw new Error(`Failed to fetch PR: ${prResponse.statusText}`);
    }
    const pr = await prResponse.json();
    let textToScan = `${pr.title || ""} ${pr.body || ""}`;

    // 2. Fetch PR commits
    const commitsUrl = `https://api.github.com/repos/${input.repoName}/pulls/${input.prNumber}/commits`;
    const commitsResponse = await fetch(commitsUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (commitsResponse.ok) {
      const commits = await commitsResponse.json() as GithubCommitInfo[];
      if (Array.isArray(commits)) {
        textToScan += " " + commits.map((c) => c.commit?.message || "").join(" ");
      }
    }

    // 3. Scan for issue keys
    const matches = textToScan.match(/([a-zA-Z0-9]+)-(\d+)/g);
    if (!matches || matches.length === 0) {
      return [];
    }

    const identifiers: { teamKey: string; number: number }[] = [];
    const seen = new Set<string>();
    
    for (const match of matches) {
      const parts = match.split("-");
      const key = parts[0].toUpperCase();
      const num = parseInt(parts[1], 10);
      const idStr = `${key}-${num}`;
      
      if (!seen.has(idStr)) {
        seen.add(idStr);
        identifiers.push({ teamKey: key, number: num });
      }
    }

    return await ctx.runQuery(internal.agent.data.issueSummariesByIdentifiers, {
      orgId: ctx.orgId,
      identifiers,
    });
  },
});

const analyzePRRisk = createTool({
  description: "Examine a PR's changed files and diff to compute a risk score (1-10) and summary using LLM reasoning.",
  inputSchema: jsonSchema<{ repoName: string; prNumber: number }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "Repository full name, e.g. owner/repo" },
      prNumber: { type: "number", description: "The Pull Request number" },
    },
    required: ["repoName", "prNumber"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<
    | { riskScore: number; reason: string; criticalFilesTouched: string[] }
    | { rawLLMResponse: string }
  > => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);

    // 1. Fetch changed files list
    const filesUrl = `https://api.github.com/repos/${input.repoName}/pulls/${input.prNumber}/files`;
    const filesResponse = await fetch(filesUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    if (!filesResponse.ok) {
      throw new Error(`Failed to fetch changed files: ${filesResponse.statusText}`);
    }
    const files = await filesResponse.json() as GithubFile[];
    const changedFilesSummary = (files || []).map((f) => `${f.filename} (+${f.additions}, -${f.deletions})`).join("\n");

    // 2. Fetch raw diff (limit to avoid token limit errors)
    const diffUrl = `https://api.github.com/repos/${input.repoName}/pulls/${input.prNumber}`;
    const diffResponse = await fetch(diffUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "OpenGrove-Agent",
      },
    });
    let rawDiff = "";
    if (diffResponse.ok) {
      rawDiff = await diffResponse.text();
      if (rawDiff.length > 50000) {
        rawDiff = rawDiff.substring(0, 50000) + "\n... [diff truncated for length]";
      }
    }

    // 3. Ask LLM to evaluate risk
    const prompt = `You are a Senior Security & Release Engineer. Review the following details of GitHub Pull Request #${input.prNumber} in "${input.repoName}":

Changed files:
${changedFilesSummary}

Diff Summary:
${rawDiff}

Analyze the changes. Focus on:
1. Impact on critical configuration files, auth files, dependencies, and database schemas.
2. Code complexity and volume of changes.
3. Potential for regression, security vulnerabilities, or infrastructure breakage.

Respond with a JSON block containing:
- riskScore: A number from 1 (very safe) to 10 (extremely risky/dangerous).
- reason: A short, concise summary explaining the score.
- criticalFilesTouched: A list of any highly sensitive files modified.`;

    const { text } = await generateText({
      model: chatModel,
      prompt,
    });

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { rawLLMResponse: text };
    } catch {
      return { rawLLMResponse: text };
    }
  },
});

const postPRComment = createTool({
  description: "Post a comment or PR review text on a connected GitHub repository Pull Request.",
  inputSchema: jsonSchema<{ repoName: string; prNumber: number; body: string }>({
    type: "object",
    properties: {
      repoName: { type: "string", description: "Repository full name, e.g. owner/repo" },
      prNumber: { type: "number", description: "The Pull Request number" },
      body: { type: "string", description: "The markdown text of the comment to post" },
    },
    required: ["repoName", "prNumber", "body"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<{ commentId: number; url: string }> => {
    await assertRepoConnected(ctx, input.repoName);
    const token = await getGithubToken(ctx);
    const url = `https://api.github.com/repos/${input.repoName}/issues/${input.prNumber}/comments`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "OpenGrove-Agent",
      },
      body: JSON.stringify({ body: input.body }),
    });
    if (!response.ok) {
      throw new Error(`Failed to post comment: ${response.statusText}`);
    }
    const data = await response.json();
    return { commentId: data.id, url: data.html_url };
  },
});

const createSkill = createTool({
  description: "Create a new AI agent skill in the workspace. Use this to teach the agent new capabilities like summarizing PRs or triaging issues.",
  inputSchema: jsonSchema<{
    name: string;
    description?: string;
    type?: "triage" | "review" | "docs" | "security" | "style" | "release" | "custom";
    content: string;
  }>({
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      type: { type: "string", enum: ["triage", "review", "docs", "security", "style", "release", "custom"] },
      content: { type: "string", description: "The system prompt or instruction for this skill" },
    },
    required: ["name", "content"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input) => {
    return await ctx.runMutation(internal.agent.data.createSkillForAgent, {
      orgId: ctx.orgId,
      actorUserId: ctx.requestUserId,
      name: input.name,
      description: input.description,
      type: input.type || "custom",
      content: input.content,
    });
  },
});

const createLoop = createTool({
  description: "Create a new agentic feedback loop combining an action skill and a validation skill. You MUST use createSkill first to create the skills if they don't exist.",
  inputSchema: jsonSchema<{
    name: string;
    description?: string;
    actionSkillId: string;
    validationSkillId: string;
    maxIterations?: number;
  }>({
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      actionSkillId: { type: "string", description: "The ID of the action skill" },
      validationSkillId: { type: "string", description: "The ID of the validation skill" },
      maxIterations: { type: "number", description: "Default is 3" },
    },
    required: ["name", "actionSkillId", "validationSkillId"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input) => {
    return await ctx.runMutation(internal.agent.data.createLoopForAgent, {
      orgId: ctx.orgId,
      actorUserId: ctx.requestUserId,
      name: input.name,
      description: input.description,
      actionSkillId: input.actionSkillId as Id<"skills">,
      validationSkillId: input.validationSkillId as Id<"skills">,
      maxIterations: input.maxIterations || 3,
    });
  },
});

const scrapeWebContent = createTool({
  description: "Scrape the content of any public URL and return it as clean Markdown. Useful for reading external documentation, articles, or competitor sites.",
  inputSchema: jsonSchema<{ url: string }>({
    type: "object",
    properties: {
      url: { type: "string", description: "The fully qualified URL to scrape" },
    },
    required: ["url"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<{ markdown: string; title?: string } | { error: string }> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return { error: "FIRECRAWL_API_KEY environment variable is missing on the server. Please add it to the Convex deployment." };
    }
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: input.url,
        formats: ["markdown"],
      }),
    });

    if (!response.ok) {
      return { error: `Firecrawl API failed: ${response.statusText}` };
    }
    const data = await response.json();
    if (!data.success) {
      return { error: data.error || "Unknown scraping error" };
    }
    return {
      markdown: data.data.markdown,
      title: data.data.metadata?.title,
    };
  },
});

const spawnResearchAgent = createTool({
  description: "Spawn a dedicated sub-agent to perform deep reasoning on a specific topic. Use this when you need to delegate a complex analytical task, synthesize a large amount of raw data, or run parallel reasoning without cluttering your main context.",
  inputSchema: jsonSchema<{ task: string; rawDataToProcess?: string }>({
    type: "object",
    properties: {
      task: { type: "string", description: "Detailed instructions for the sub-agent on what to analyze or write" },
      rawDataToProcess: { type: "string", description: "Any raw text (like PR diffs, scraped markdown, issue bodies) the sub-agent should read to complete the task" },
    },
    required: ["task"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<{ result: string }> => {
    const prompt = `You are an expert Research Sub-Agent inside OpenGrove.
Your objective is to accomplish the following task with extreme precision and depth.

TASK:
${input.task}

${input.rawDataToProcess ? `\nRAW DATA TO PROCESS:\n${input.rawDataToProcess}\n` : ""}

Analyze the provided information and produce a comprehensive, structured response that directly fulfills the task. Do not include pleasantries; output only the final synthesized report or answer.`;

    const { text } = await generateText({
      model: chatModel,
      prompt,
    });

    return { result: text };
  },
});

const queryGBrain = createTool({
  description: "Query the local GBrain knowledge graph (long-term memory) for information about projects, past decisions, or surface data. Provide a semantic query.",
  inputSchema: jsonSchema<{ query: string }>({
    type: "object",
    properties: {
      query: { type: "string", description: "The semantic search query for GBrain" },
    },
    required: ["query"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<{ results: any[] } | { error: string }> => {
    // We expect the user to expose their local GBrain MCP/REST server via a tunnel
    // e.g. ngrok http 8080 and set GBRAIN_API_URL in the Convex environment.
    const gbrainUrl = process.env.GBRAIN_API_URL;
    const gbrainKey = process.env.GBRAIN_API_KEY;
    if (!gbrainUrl) {
      return { error: "GBRAIN_API_URL is not set on the Convex deployment. The user must tunnel their local GBrain instance (e.g., via ngrok) and set this variable." };
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (gbrainKey) {
        headers["Authorization"] = `Bearer ${gbrainKey}`;
      }
      
      const response = await fetch(`${gbrainUrl}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: input.query }),
      });
      if (!response.ok) {
        return { error: `GBrain query failed: ${response.statusText}` };
      }
      const data = await response.json();
      return { results: data.results || [] };
    } catch (err) {
      return { error: `Failed to connect to GBrain: ${(err as Error).message}` };
    }
  },
});

const syncGBrain = createTool({
  description: "Sync or extract new information into the GBrain knowledge graph so it is remembered long-term.",
  inputSchema: jsonSchema<{ content: string; source: string }>({
    type: "object",
    properties: {
      content: { type: "string", description: "The raw text or knowledge to store in GBrain" },
      source: { type: "string", description: "The source identifier (e.g. 'OpenGrove Agent', 'PR #123')" },
    },
    required: ["content", "source"],
    additionalProperties: false,
  }),
  execute: async (ctx: VectorToolCtx, input): Promise<{ success: boolean; message: string }> => {
    const gbrainUrl = process.env.GBRAIN_API_URL;
    const gbrainKey = process.env.GBRAIN_API_KEY;
    if (!gbrainUrl) {
      return { success: false, message: "GBRAIN_API_URL is not set." };
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (gbrainKey) {
        headers["Authorization"] = `Bearer ${gbrainKey}`;
      }

      const response = await fetch(`${gbrainUrl}/extract`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: input.content, metadata: { source: input.source } }),
      });
      if (!response.ok) {
        return { success: false, message: `GBrain sync failed: ${response.statusText}` };
      }
      return { success: true, message: "Knowledge successfully extracted into GBrain." };
    } catch (err) {
      return { success: false, message: `Failed to connect to GBrain: ${(err as Error).message}` };
    }
  },
});

export const vectorTools = {
  listTeams,
  listMembers,
  projectStatus,
  searchIssues,
  findSimilarIssues,
  createIssue,
  updateIssue,
  cycleSummary,
  standupReport,
  fetchPRDiff,
  fetchChangedFiles,
  fetchFileContent,
  searchRepoCode,
  mapPRToIssues,
  analyzePRRisk,
  postPRComment,
  createSkill,
  createLoop,
  scrapeWebContent,
  spawnResearchAgent,
  queryGBrain,
  syncGBrain,
};
