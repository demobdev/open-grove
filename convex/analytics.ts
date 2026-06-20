import { v } from "convex/values";
import { orgQuery } from "./lib/customFunctions";
import { Id } from "./_generated/dataModel";

export const getIssueStats = orgQuery({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    // Stats by status
    const statusCounts = issues.reduce(
      (acc, issue) => {
        const s = issue.status;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Velocity over the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    // Group issues by creation date (YYYY-MM-DD)
    const recentIssues = issues.filter((i) => i._creationTime >= thirtyDaysAgo);
    
    const velocityMap = new Map<string, { created: number; completed: number }>();
    
    // Initialize the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      velocityMap.set(dateStr, { created: 0, completed: 0 });
    }

    recentIssues.forEach((issue) => {
      const createdDate = new Date(issue._creationTime).toISOString().split("T")[0];
      if (velocityMap.has(createdDate)) {
        velocityMap.get(createdDate)!.created += 1;
      }
      
      // If completed, add to completed count
      if (issue.status === "done" || issue.status === "canceled") {
        // Technically this should be when it was completed, but using creationTime for simplicity in this demo.
        // A real app would have a completedAt field.
        if (velocityMap.has(createdDate)) {
          velocityMap.get(createdDate)!.completed += 1;
        }
      }
    });

    const velocityData = Array.from(velocityMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return {
      total: issues.length,
      statusCounts,
      velocityData,
    };
  },
});
