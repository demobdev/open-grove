import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { orgQuery } from "./lib/customFunctions";

/**
 * List all inbox notifications (mentions, comments, assignments, status changes)
 * for the current authenticated user in the active organization.
 */
export const listNotifications = orgQuery({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      type: v.union(v.literal("activity"), v.literal("comment"), v.literal("mention")),
      issueId: v.id("issues"),
      issueKey: v.string(),
      issueTitle: v.string(),
      actorName: v.string(),
      actorImageUrl: v.optional(v.string()),
      timestamp: v.number(),
      data: v.object({
        activityType: v.optional(v.string()),
        field: v.optional(v.string()),
        oldValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
        body: v.optional(v.string()),
      }),
    })
  ),
  handler: async (ctx) => {
    // 1. Fetch all teams in this org to construct issue display keys
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
    const teamMap = new Map(teams.map((t) => [t._id, t]));

    // 2. Fetch issues assigned to the current user
    const assignedIssues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) =>
        q.eq("orgId", ctx.org._id).eq("assigneeId", ctx.user._id)
      )
      .collect();

    const createdIssues = await ctx.db
      .query("issues")
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), ctx.org._id),
          q.eq(q.field("creatorId"), ctx.user._id)
        )
      )
      .collect();

    // Merge into a map of unique issues
    const issueMap = new Map(
      [...assignedIssues, ...createdIssues].map((i) => [i._id, i])
    );

    const events: {
      id: string;
      type: "activity" | "comment" | "mention";
      issueId: Id<"issues">;
      issueKey: string;
      issueTitle: string;
      actorId: string;
      timestamp: number;
      data: {
        activityType?: string;
        field?: string;
        oldValue?: string;
        newValue?: string;
        body?: string;
      };
    }[] = [];
    const processedCommentIds = new Set<string>();
    const processedActivityIds = new Set<string>();

    // 4. Gather activities and comments for all these issues
    for (const issue of issueMap.values()) {
      const team = teamMap.get(issue.teamId);
      const issueKey = `${team ? team.key : "ISSUE"}-${issue.number}`;

      // Get activities on this issue
      const activities = await ctx.db
        .query("activity")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();

      for (const act of activities) {
        if (act.actorId === ctx.user._id) continue; // Skip own changes
        processedActivityIds.add(act._id);

        events.push({
          id: act._id,
          type: "activity",
          issueId: issue._id,
          issueKey,
          issueTitle: issue.title,
          actorId: act.actorId,
          timestamp: act._creationTime,
          data: {
            activityType: act.type,
            field: act.field,
            oldValue: act.oldValue,
            newValue: act.newValue,
          },
        });
      }

      // Get comments on this issue
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();

      for (const comment of comments) {
        if (comment.authorId === ctx.user._id) continue; // Skip own comments
        processedCommentIds.add(comment._id);

        const isMentioned = comment.mentions?.includes(ctx.user._id) ?? false;
        events.push({
          id: comment._id,
          type: isMentioned ? "mention" : "comment",
          issueId: issue._id,
          issueKey,
          issueTitle: issue.title,
          actorId: comment.authorId,
          timestamp: comment._creationTime,
          data: {
            body: comment.body,
          },
        });
      }
    }

    // 5. Gather mentions on any OTHER issues in the organization
    const allComments = await ctx.db
      .query("comments")
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) => q.eq(q.field("orgId"), ctx.org._id))
      .collect();

    for (const comment of allComments) {
      if (comment.authorId === ctx.user._id) continue;
      if (processedCommentIds.has(comment._id)) continue;

      const isMentioned = comment.mentions?.includes(ctx.user._id) ?? false;
      if (isMentioned) {
        const issue = await ctx.db.get(comment.issueId);
        if (issue && issue.orgId === ctx.org._id) {
          const team = teamMap.get(issue.teamId);
          const issueKey = `${team ? team.key : "ISSUE"}-${issue.number}`;

          events.push({
            id: comment._id,
            type: "mention",
            issueId: issue._id,
            issueKey,
            issueTitle: issue.title,
            actorId: comment.authorId,
            timestamp: comment._creationTime,
            data: {
              body: comment.body,
            },
          });
        }
      }
    }

    // 6. Look up user details for all unique actors
    const actorIds = new Set<string>(events.map((e) => e.actorId));
    const actorDetails = new Map<string, { name: string; imageUrl?: string }>();
    
    for (const actorId of actorIds) {
      const user = await ctx.db.get(actorId as Id<"users">);
      if (user) {
        actorDetails.set(actorId, {
          name: user.name,
          imageUrl: user.imageUrl,
        });
      }
    }

    // 7. Format, filter out events with missing actors, and sort by timestamp desc
    const formattedEvents = events
      .map((e) => {
        const actor = actorDetails.get(e.actorId);
        if (!actor) return null;

        return {
          id: e.id,
          type: e.type,
          issueId: e.issueId,
          issueKey: e.issueKey,
          issueTitle: e.issueTitle,
          actorName: actor.name,
          actorImageUrl: actor.imageUrl,
          timestamp: e.timestamp,
          data: e.data,
        };
      })
      .filter((e): e is Exclude<typeof e, null> => e !== null)
      .sort((a, b) => b.timestamp - a.timestamp);

    return formattedEvents;
  },
});
