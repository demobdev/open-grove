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
import type * as attachments from "../attachments.js";
import type * as comments from "../comments.js";
import type * as http from "../http.js";
import type * as issueRelations from "../issueRelations.js";
import type * as issues from "../issues.js";
import type * as labels from "../labels.js";
import type * as lib_activity from "../lib/activity.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_limits from "../lib/limits.js";
import type * as organizations from "../organizations.js";
import type * as presenceFns from "../presenceFns.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  attachments: typeof attachments;
  comments: typeof comments;
  http: typeof http;
  issueRelations: typeof issueRelations;
  issues: typeof issues;
  labels: typeof labels;
  "lib/activity": typeof lib_activity;
  "lib/auth": typeof lib_auth;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/limits": typeof lib_limits;
  organizations: typeof organizations;
  presenceFns: typeof presenceFns;
  teams: typeof teams;
  users: typeof users;
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
