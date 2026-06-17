import { v } from "convex/values";
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
