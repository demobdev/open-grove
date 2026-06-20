import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { internal } from "./_generated/api";

/** Handle incoming Slack slash commands/events. */
export const handleSlackWebhook = internalAction({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    if (args.payload.command === "/opengrove") {
      const text = args.payload.text as string || "";
      const userId = args.payload.user_id as string;
      const channelId = args.payload.channel_id as string;

      if (text.startsWith("create ")) {
        const title = text.substring(7).trim();
        if (!title) {
          return new Response("Please provide an issue title: /opengrove create <title>", { status: 200 });
        }

        // Just create an automation or generic issue.
        // We need an org to do this. We can use an environment variable for default org or we can't easily map slack workspace.
        return new Response(JSON.stringify({
          response_type: "in_channel",
          text: `Command received: *${title}*. (Mapping Slack to OpenGrove orgs is WIP!)`
        }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response("Unknown command. Try: /opengrove create <title>", { status: 200 });
    }

    if (args.payload.challenge) {
      return new Response(args.payload.challenge, { status: 200 });
    }

    return new Response(null, { status: 200 });
  },
});

/** Save the Slack Webhook URL for the active organization in the connectedRepos table. */
export const saveSlackWebhook = orgMutation({
  args: { webhookUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Find and delete any existing Slack webhook entries for this organization
    const existing = await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    for (const item of existing) {
      if (item.repoName.startsWith("slack:")) {
        await ctx.db.delete(item._id);
      }
    }

    // 2. If a new URL is provided, save it with a "slack:" prefix
    if (args.webhookUrl.trim() !== "") {
      await ctx.db.insert("connectedRepos", {
        orgId: ctx.org._id,
        repoName: `slack:${args.webhookUrl.trim()}`,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

/** Get the Slack Webhook URL for the active organization. */
export const getSlackWebhook = orgQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const connections = await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    const slackConnection = connections.find((c) => c.repoName.startsWith("slack:"));
    if (!slackConnection) {
      return null;
    }

    // Strip the "slack:" prefix to return the raw URL
    return slackConnection.repoName.substring(6);
  },
});

/**
 * Send a notification payload to Slack. Designed to be scheduled/run
 * in the background from mutations to prevent slow API response times.
 */
export const postToSlack = action({
  args: {
    webhookUrl: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
        }),
      });

      if (!response.ok) {
        console.error("Failed to post to Slack:", await response.text());
        return { success: false };
      }
      return { success: true };
    } catch (err) {
      console.error("Error posting to Slack:", err);
      return { success: false };
    }
  },
});

/** Send a test message to verify the Slack Webhook URL. */
export const sendTestMessage = action({
  args: { webhookUrl: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "🚀 **Hello from OpenGrove!** Your Slack webhook integration has been configured and tested successfully.",
        }),
      });

      if (!response.ok) {
        return { success: false, error: await response.text() };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
