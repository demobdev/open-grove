import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction, ActionCtx } from "./_generated/server";

const http = httpRouter();

type ClerkEvent = {
  type: string;
  data: Record<string, unknown>;
};

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await request.text();

    let event: ClerkEvent;
    try {
      const wh = new Webhook(secret);
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkEvent;
    } catch (error) {
      console.error("Clerk webhook verification failed", error);
      return new Response("Verification failed", { status: 400 });
    }

    await ctx.runMutation(internal.webhooks.handleClerkEvent, {
      eventType: event.type,
      data: event.data,
    });

    return new Response(null, { status: 200 });
  }),
});

async function verifyGithubSignature(secret: string, payload: string, signatureHeader: string): Promise<boolean> {
  if (!signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const signature = signatureHeader.substring(7);
  
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(secret);
  const dataBuffer = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    dataBuffer
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hexSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hexSignature === signature;
}

http.route({
  path: "/github-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.text();
    
    // Signature verification is optional for easy local testing, but enforced if secret is set
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        return new Response("Missing signature", { status: 401 });
      }
      const verified = await verifyGithubSignature(secret, payload, signature);
      if (!verified) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const event = request.headers.get("x-github-event");
    if (!event) {
      return new Response("Missing x-github-event header", { status: 400 });
    }

    await ctx.runMutation(internal.github.handleGithubEvent, {
      event,
      payload,
    });

    return new Response(null, { status: 200 });
  }),
});

// ── External API (Phase 1) ────────────────────────────────────────────────

/**
 * Helper to securely verify an API key from the Authorization header.
 * Expected format: "Bearer og_abcdef123..."
 */
async function verifyApiKey(ctx: ActionCtx, request: Request, requiredScope?: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const rawKey = authHeader.substring(7);
  
  // Hash the raw key provided by the client
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Look up the key by hash
  const apiKey = await ctx.runQuery(internal.apiKeys.internalGetByKeyHash, { keyHash });
  if (!apiKey || apiKey.revokedAt) {
    return { error: "Invalid or revoked API key", status: 401 };
  }

  // Enforce scopes if requested
  if (requiredScope && !apiKey.scopes.includes(requiredScope) && !apiKey.scopes.includes("all")) {
    return { error: `Missing required scope: ${requiredScope}`, status: 403 };
  }

  // Update last used timestamp in the background
  await ctx.runMutation(internal.apiKeys.internalUpdateLastUsed, { apiKeyId: apiKey._id });

  return { apiKey };
}

/**
 * GET /api/skills
 * 
 * The external Skills API for Cursor, Claude Code, and local scripts.
 * Returns the active skills for the organization.
 */
http.route({
  path: "/api/skills",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyApiKey(ctx, request, "skills:read");
    if (auth.error || !auth.apiKey) {
      return new Response(JSON.stringify({ error: auth.error || "Unauthorized" }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orgId = auth.apiKey.orgId;

    // Optional query parameters for scoping
    const url = new URL(request.url);
    const _repo = url.searchParams.get("repo") || undefined;
    
    // In a real implementation we would filter by repo/team scope here.
    // For now, we return all active skills for the org.
    const skills = await ctx.runQuery(internal.skills.internalListActiveSkills, { orgId });

    return new Response(JSON.stringify({ skills }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * GET /api/context
 * 
 * The external Context API for Cursor, Claude Code, and local scripts.
 * Returns the active skills and specific issue context for the organization.
 */
http.route({
  path: "/api/context",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyApiKey(ctx, request);
    if (auth.error || !auth.apiKey) {
      return new Response(JSON.stringify({ error: auth.error || "Unauthorized" }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = auth.apiKey;
    
    // Enforce required scopes
    const hasReadSkills = apiKey.scopes.includes("skills:read") || apiKey.scopes.includes("all");
    const hasReadIssues = apiKey.scopes.includes("issues:read") || apiKey.scopes.includes("all");
    
    if (!hasReadSkills && !hasReadIssues) {
      return new Response(JSON.stringify({ error: "Missing required scopes" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orgId = apiKey.orgId;

    const url = new URL(request.url);
    const issueKey = url.searchParams.get("issueKey");
    const repo = url.searchParams.get("repo");
    
    let skillsResponse = undefined;
    if (hasReadSkills) {
      skillsResponse = await ctx.runQuery(internal.skills.internalListActiveSkills, { orgId });
    }

    let issueResponse = undefined;
    if (hasReadIssues && issueKey) {
      const issue = await ctx.runQuery(internal.issues.internalGetIssueByKey, { 
        orgId, 
        issueKey 
      });
      if (issue) {
        issueResponse = {
          key: issueKey.toUpperCase(),
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
        };
      }
    }

    const responsePayload = {
      org: orgId,
      repo: repo || undefined,
      skills: skillsResponse,
      issue: issueResponse,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * POST /api/webhook/:automationId
 * 
 * The external Webhook API for Zapier, Make, custom integrations, etc.
 * Dispatches an automation using the body as payload.
 */
http.route({
  pathPrefix: "/api/webhook/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyApiKey(ctx, request);
    if (auth.error || !auth.apiKey) {
      return new Response(JSON.stringify({ error: auth.error || "Unauthorized" }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const automationId = pathParts[pathParts.length - 1];

    if (!automationId) {
      return new Response(JSON.stringify({ error: "Missing automationId in URL" }), { status: 400 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      payload = await request.text();
    }

    // Call dispatchAutomation in the background
    await ctx.runAction(internal.automations.dispatchAutomation, {
      automationId: automationId as any,
      payload,
    });

    return new Response(JSON.stringify({ success: true, message: "Webhook received and automation dispatched" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;

