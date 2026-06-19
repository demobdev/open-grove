import { v } from "convex/values";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertCanCreateApiKey } from "./lib/limits";
import { internalQuery, internalMutation } from "./_generated/server";

export const listApiKeys = orgQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .collect();
  },
});

export const internalGetByKeyHash = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();
  },
});

export const internalUpdateLastUsed = internalMutation({
  args: { apiKeyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.apiKeyId, { lastUsedAt: Date.now() });
  },
});

export const createApiKey = orgMutation({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
    keyHash: v.string(),
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    await assertCanCreateApiKey(ctx, ctx.org);

    const apiKeyId = await ctx.db.insert("apiKeys", {
      orgId: ctx.org._id,
      name: args.name,
      prefix: args.prefix,
      keyHash: args.keyHash,
      scopes: args.scopes,
      createdBy: ctx.user._id,
    });

    return apiKeyId;
  },
});

export const revokeApiKey = orgMutation({
  args: { apiKeyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.orgId !== ctx.org._id) {
      throw new Error("API key not found");
    }
    if (apiKey.revokedAt) {
      return;
    }
    await ctx.db.patch(args.apiKeyId, {
      revokedAt: Date.now(),
    });
  },
});
