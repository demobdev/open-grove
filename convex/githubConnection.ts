import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { orgMutation, orgQuery } from "./lib/customFunctions";

/**
 * Fetch the current user's GitHub repositories by fetching their GitHub OAuth
 * token from Clerk and querying GitHub's API.
 */
export const listUserRepositories = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clerkUserId = identity.subject; // Clerk User ID
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured on the Convex deployment");
    }

    // 1. Fetch GitHub access token from Clerk
    const clerkUrl = `https://api.clerk.com/v1/users/${clerkUserId}/oauth_access_tokens/github`;
    const clerkResponse = await fetch(clerkUrl, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!clerkResponse.ok) {
      console.error("Clerk OAuth token fetch failed:", await clerkResponse.text());
      return { success: false, error: "Clerk token fetch failed" };
    }

    const tokens = await clerkResponse.json();
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return { success: false, error: "not_linked" };
    }

    const githubToken = tokens[0].token;
    if (!githubToken) {
      return { success: false, error: "not_linked" };
    }

    // 2. Fetch repositories from GitHub
    const githubUrl = "https://api.github.com/user/repos?per_page=100&sort=updated";
    const githubResponse = await fetch(githubUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "OpenGrove-App",
      },
    });

    if (!githubResponse.ok) {
      console.error("GitHub API request failed:", await githubResponse.text());
      return { success: false, error: "GitHub API request failed" };
    }

    interface GitHubRepoPayload {
      id: number;
      full_name: string;
      name: string;
      private: boolean;
    }

    const repos = (await githubResponse.json()) as GitHubRepoPayload[];
    if (!Array.isArray(repos)) {
      return { success: false, error: "Invalid response from GitHub" };
    }

    const formattedRepos = repos.map((repo) => ({
      id: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      private: repo.private,
    }));

    return { success: true, repos: formattedRepos };
  },
});

/** Connect a repository to the active organization. */
export const connectRepo = orgMutation({
  args: { repoName: v.string() },
  returns: v.id("connectedRepos"),
  handler: async (ctx, args) => {
    // Check if already connected
    const existing = await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) => q.eq(q.field("repoName"), args.repoName))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("connectedRepos", {
      orgId: ctx.org._id,
      repoName: args.repoName,
      createdAt: Date.now(),
    });
  },
});

/** Disconnect a repository from the active organization. */
export const disconnectRepo = orgMutation({
  args: { repoName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) => q.eq(q.field("repoName"), args.repoName))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
    return null;
  },
});

/** List all connected repositories for the active organization. */
export const listConnectedRepos = orgQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("connectedRepos"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      repoName: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
  },
});

interface GitHubIssuePayload {
  id: number;
  number: number;
  title: string;
  body: string | null;
  pull_request?: Record<string, unknown>;
  milestone?: {
    id: number;
    title: string;
  } | null;
  labels?: {
    name: string;
    color: string;
  }[];
}

interface GitHubMilestonePayload {
  id: number;
  number: number;
  title: string;
  description: string | null;
}

/** Fetch issues and milestones from a GitHub repository. */
export const fetchGithubIssuesAndMilestones = action({
  args: { repoName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const clerkUserId = identity.subject; // Clerk User ID
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured on the Convex deployment");
    }

    // 1. Fetch GitHub access token from Clerk
    const clerkUrl = `https://api.clerk.com/v1/users/${clerkUserId}/oauth_access_tokens/github`;
    const clerkResponse = await fetch(clerkUrl, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!clerkResponse.ok) {
      console.error("Clerk OAuth token fetch failed:", await clerkResponse.text());
      return { success: false, error: "Clerk token fetch failed" };
    }

    const tokens = await clerkResponse.json();
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return { success: false, error: "not_linked" };
    }

    const githubToken = tokens[0].token;
    if (!githubToken) {
      return { success: false, error: "not_linked" };
    }

    // 2. Fetch issues from GitHub (only open ones, first page up to 100)
    const githubIssuesUrl = `https://api.github.com/repos/${args.repoName}/issues?state=open&per_page=100`;
    const issuesResponse = await fetch(githubIssuesUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "OpenGrove-App",
      },
    });

    if (!issuesResponse.ok) {
      console.error("GitHub API request failed for issues:", await issuesResponse.text());
      return { success: false, error: "GitHub issues fetch failed" };
    }

    const ghIssues = await issuesResponse.json();
    if (!Array.isArray(ghIssues)) {
      return { success: false, error: "Invalid response from GitHub" };
    }

    // 3. Fetch milestones from GitHub
    const githubMilestonesUrl = `https://api.github.com/repos/${args.repoName}/milestones?state=open&per_page=100`;
    const milestonesResponse = await fetch(githubMilestonesUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "OpenGrove-App",
      },
    });

    if (!milestonesResponse.ok) {
      console.error("GitHub API request failed for milestones:", await milestonesResponse.text());
      return { success: false, error: "GitHub milestones fetch failed" };
    }

    const ghMilestones = await milestonesResponse.json();
    if (!Array.isArray(ghMilestones)) {
      return { success: false, error: "Invalid milestones response from GitHub" };
    }

    // 4. Format and filter issues (exclude pull requests)
    const issues = (ghIssues as GitHubIssuePayload[])
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || "",
        milestoneId: issue.milestone?.id || null,
        milestoneTitle: issue.milestone?.title || null,
        labels: Array.isArray(issue.labels)
          ? issue.labels.map((l) => ({ name: l.name, color: l.color }))
          : [],
      }));

    const milestones = (ghMilestones as GitHubMilestonePayload[]).map((ms) => ({
      id: ms.id,
      number: ms.number,
      title: ms.title,
      description: ms.description || "",
    }));

    return { success: true, issues, milestones };
  },
});

/** Create the team, link the repository, import milestones/issues, and log activity. */
export const initializeWorkspace = orgMutation({
  args: {
    teamName: v.string(),
    teamKey: v.string(),
    repoName: v.optional(v.string()),
    milestones: v.array(
      v.object({
        id: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
      })
    ),
    issues: v.array(
      v.object({
        title: v.string(),
        body: v.optional(v.string()),
        milestoneId: v.union(v.number(), v.null()),
      })
    ),
  },
  returns: v.object({
    teamId: v.id("teams"),
  }),
  handler: async (ctx, args) => {
    // 1. Create the team
    const teamKeyUpper = args.teamKey.trim().toUpperCase();
    
    // Check if team with this key already exists in the org
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_org_and_key", (q) => q.eq("orgId", ctx.org._id).eq("key", teamKeyUpper))
      .first();
      
    if (existingTeam) {
      throw new Error(`Team with key ${teamKeyUpper} already exists in this workspace`);
    }

    const nextIssueNumber = args.issues.length + 1;

    const teamId = await ctx.db.insert("teams", {
      orgId: ctx.org._id,
      name: args.teamName.trim(),
      key: teamKeyUpper,
      nextIssueNumber,
    });

    // 2. Link repository if provided
    if (args.repoName) {
      // Check if already connected
      const existingConn = await ctx.db
        .query("connectedRepos")
        .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
        // eslint-disable-next-line @convex-dev/no-filter-in-query
        .filter((q) => q.eq(q.field("repoName"), args.repoName))
        .first();

      if (!existingConn) {
        await ctx.db.insert("connectedRepos", {
          orgId: ctx.org._id,
          repoName: args.repoName,
          createdAt: Date.now(),
        });
      }
    }

    // 3. Create projects from milestones
    // We map GitHub milestone ID to Convex Project ID
    const milestoneMap = new Map<number, Id<"projects">>();
    for (const ms of args.milestones) {
      const projectId = await ctx.db.insert("projects", {
        orgId: ctx.org._id,
        name: ms.title,
        description: ms.description,
        status: "in_progress",
      });
      milestoneMap.set(ms.id, projectId);
    }

    // 4. Create issues and log activity
    let index = 0;
    for (const issue of args.issues) {
      index++;
      const issueNumber = index; // start from 1 to N
      const sortOrder = 10000 - index * 10; // descending sortOrder

      const projectId = issue.milestoneId !== null ? milestoneMap.get(issue.milestoneId) : undefined;

      const issueId = await ctx.db.insert("issues", {
        orgId: ctx.org._id,
        teamId,
        number: issueNumber,
        title: issue.title.trim(),
        description: issue.body,
        status: "todo",
        priority: "none",
        creatorId: ctx.user._id,
        projectId,
        sortOrder,
      });

      // Log created activity
      await ctx.db.insert("activity", {
        orgId: ctx.org._id,
        issueId,
        actorId: ctx.user._id,
        type: "created",
      });
    }

    return { teamId };
  },
});
