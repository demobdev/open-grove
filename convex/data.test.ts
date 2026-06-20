// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema.js";
import { api } from "./_generated/api.js";

test("getDashboardStats returns default empty metrics", async () => {
  const t = convexTest(schema, (import.meta as any).glob("./**/*.*s"));
  
  // Set up mock authenticated user and organization
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      clerkId: "user_123",
      email: "test@example.com",
      name: "Test User",
    });
  });

  const orgId = await t.run(async (ctx) => {
    return await ctx.db.insert("organizations", {
      clerkOrgId: "org_123",
      name: "Test Org",
      slug: "test-org",
      plan: "pro",
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("members", {
      orgId,
      userId,
      role: "admin",
      clerkMembershipId: "mem_123",
    });
  });

  // Execute the query as the authenticated user
  const stats = await t.withIdentity({ subject: "user_123", org_id: "org_123" }).query(api.agent.data.getDashboardStats);
  
  expect(stats).toBeDefined();
  expect(stats.activeLoopsCount).toBe(0);
  expect(stats.totalSkillsCount).toBe(0);
  expect(stats.pendingBatchesCount).toBe(0);
  expect(stats.totalRunsCount).toBe(0);
  expect(stats.recentActivity).toEqual([]);
  expect(stats.myIssues).toEqual([]);
});
