import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { internal } from "./_generated/api";

/** Handle incoming Discord slash commands/events. */
export const handleDiscordWebhook = internalAction({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    // Discord sends interaction payloads
    const type = args.payload.type;
    
    // Type 1 is a PING from Discord to verify the endpoint
    if (type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Type 2 is an APPLICATION_COMMAND (slash command)
    if (type === 2 && args.payload.data?.name === "opengrove") {
      const options = args.payload.data.options || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textOption = options.find((o: any) => o.name === "text" || o.name === "query" || o.name === "title");
      const text = textOption?.value || "";

      if (text.startsWith("create ")) {
        const title = text.substring(7).trim();
        if (!title) {
          return new Response(JSON.stringify({
            type: 4,
            data: { content: "Please provide an issue title: /opengrove create <title>" }
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({
          type: 4,
          data: { content: `Command received: **${title}**. (Mapping Discord to OpenGrove orgs is WIP!)` }
        }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({
        type: 4,
        data: { content: "Unknown command. Try: /opengrove create <title>" }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown interaction" }), { status: 400 });
  },
});

/** Save the Discord Webhook URL for the active organization in the connectedRepos table. */
export const saveDiscordWebhook = orgMutation({
  args: { webhookUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Find and delete any existing Discord webhook entries for this organization
    const existing = await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    for (const item of existing) {
      if (item.repoName.startsWith("discord:")) {
        await ctx.db.delete(item._id);
      }
    }

    // 2. If a new URL is provided, save it with a "discord:" prefix
    if (args.webhookUrl.trim() !== "") {
      await ctx.db.insert("connectedRepos", {
        orgId: ctx.org._id,
        repoName: `discord:${args.webhookUrl.trim()}`,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

/** Get the Discord Webhook URL for the active organization. */
export const getDiscordWebhook = orgQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const connections = await ctx.db
      .query("connectedRepos")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    const discordConnection = connections.find((c) => c.repoName.startsWith("discord:"));
    if (!discordConnection) {
      return null;
    }

    // Strip the "discord:" prefix to return the raw URL
    return discordConnection.repoName.substring(8);
  },
});

/**
 * Send a notification payload to Discord. Designed to be scheduled/run
 * in the background from mutations to prevent slow API response times.
 */
export const postToDiscord = action({
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
          content: args.text,
        }),
      });

      if (!response.ok) {
        console.error("Failed to post to Discord:", await response.text());
        return { success: false };
      }
      return { success: true };
    } catch (err) {
      console.error("Error posting to Discord:", err);
      return { success: false };
    }
  },
});

/** Send a test message to verify the Discord Webhook URL. */
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
          content: "🚀 **Hello from OpenGrove!** Your Discord webhook integration has been configured and tested successfully.",
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
