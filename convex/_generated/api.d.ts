/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as agent_automationsAgent from "../agent/automationsAgent.js";
import type * as agent_chat from "../agent/chat.js";
import type * as agent_data from "../agent/data.js";
import type * as agent_embeddings from "../agent/embeddings.js";
import type * as agent_githubApp from "../agent/githubApp.js";
import type * as agent_limiter from "../agent/limiter.js";
import type * as agent_loopOrchestrator from "../agent/loopOrchestrator.js";
import type * as agent_mergeTools from "../agent/mergeTools.js";
import type * as agent_models from "../agent/models.js";
import type * as agent_templates from "../agent/templates.js";
import type * as agent_tools from "../agent/tools.js";
import type * as agent_triage from "../agent/triage.js";
import type * as agent_vectorAgent from "../agent/vectorAgent.js";
import type * as agentRuns from "../agentRuns.js";
import type * as aiSuggestions from "../aiSuggestions.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as attachments from "../attachments.js";
import type * as automations from "../automations.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as cycles from "../cycles.js";
import type * as discord from "../discord.js";
import type * as github from "../github.js";
import type * as githubConnection from "../githubConnection.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as issueRelations from "../issueRelations.js";
import type * as issues from "../issues.js";
import type * as labels from "../labels.js";
import type * as lib_activity from "../lib/activity.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_githubConfig from "../lib/githubConfig.js";
import type * as lib_limits from "../lib/limits.js";
import type * as loops from "../loops.js";
import type * as mergeQueue from "../mergeQueue.js";
import type * as organizations from "../organizations.js";
import type * as presenceFns from "../presenceFns.js";
import type * as projects from "../projects.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as skills from "../skills.js";
import type * as slack from "../slack.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as views from "../views.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  "agent/automationsAgent": typeof agent_automationsAgent;
  "agent/chat": typeof agent_chat;
  "agent/data": typeof agent_data;
  "agent/embeddings": typeof agent_embeddings;
  "agent/githubApp": typeof agent_githubApp;
  "agent/limiter": typeof agent_limiter;
  "agent/loopOrchestrator": typeof agent_loopOrchestrator;
  "agent/mergeTools": typeof agent_mergeTools;
  "agent/models": typeof agent_models;
  "agent/templates": typeof agent_templates;
  "agent/tools": typeof agent_tools;
  "agent/triage": typeof agent_triage;
  "agent/vectorAgent": typeof agent_vectorAgent;
  agentRuns: typeof agentRuns;
  aiSuggestions: typeof aiSuggestions;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  attachments: typeof attachments;
  automations: typeof automations;
  comments: typeof comments;
  crons: typeof crons;
  cycles: typeof cycles;
  discord: typeof discord;
  github: typeof github;
  githubConnection: typeof githubConnection;
  http: typeof http;
  inbox: typeof inbox;
  issueRelations: typeof issueRelations;
  issues: typeof issues;
  labels: typeof labels;
  "lib/activity": typeof lib_activity;
  "lib/auth": typeof lib_auth;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/githubConfig": typeof lib_githubConfig;
  "lib/limits": typeof lib_limits;
  loops: typeof loops;
  mergeQueue: typeof mergeQueue;
  organizations: typeof organizations;
  presenceFns: typeof presenceFns;
  projects: typeof projects;
  search: typeof search;
  seed: typeof seed;
  skills: typeof skills;
  slack: typeof slack;
  teams: typeof teams;
  users: typeof users;
  views: typeof views;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
