# OpenGrove v2: Revised Implementation Plan

> All architectural decisions from `docs/new-imp.md` are locked in. Building Phase 1 NOW.

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Schema | **Controlled migration** — dedicated tables | No hacks. No `views.filters` workaround. |
| GitHub Auth | **GitHub App installation** | Short-lived installation tokens, not PATs |
| Skills | **Structured** — types, scopes, precedence | Not "saved prompts" |
| External API | **Required** — HTTP actions + API keys | Bridge to Cursor, Claude Code, MCP |
| Execution Ledger | **Core infrastructure** — `agentRuns` + `agentRunSteps` | Before loops, before automations |
| Automations vs Loops | **Separate concepts** — different tables, different UI | Event-driven vs goal-driven |
| Approval Modes | **Required** — `suggest_only`, `draft`, `auto_execute` | Enterprise trust |
| Idempotency | **Required** — dedup keys on every run | Prevents haunted Roomba behavior |

---

## Phase 1: Skills Registry + Execution Ledger (BUILDING NOW)

### Schema Migration (4 new tables)

```
skills, apiKeys, agentRuns, agentRunSteps
```

### Files to Create/Modify

#### Schema (`convex/schema.ts`)
- Add `skills` table with structured fields
- Add `apiKeys` table with hashed storage
- Add `agentRuns` table (execution ledger)
- Add `agentRunSteps` table (step-level logging)

#### Backend
- `convex/skills.ts` — CRUD (orgQuery/orgMutation)
- `convex/apiKeys.ts` — create, list, revoke
- `convex/agentRuns.ts` — create, update, list runs + steps
- `convex/http.ts` — add `/api/skills` and `/api/context` routes
  - Enforce scopes: `skills:read`, `issues:read`, `repo_context:read`
  - Ensure minimal data is returned in context endpoints (e.g., exclude private activity/billing).

#### Frontend  
- `app/(app)/[orgSlug]/skills/page.tsx` — Skills Registry UI
- `components/skills/` — skill cards, create/edit forms
- Agent Runs view (later, after automations)

### Phase 1 Deliverables
- [ ] Schema migration with 4 new tables
- [ ] Skills CRUD backend
- [ ] API keys backend
- [ ] Agent execution ledger backend
- [ ] External Skills API (HTTP actions)
- [ ] Skills Registry UI page
- [ ] Agent discovers and uses skills at runtime

---

## Phase 1.5: UX Polish & Onboarding (NEW)

The orchestration layer relies heavily on keyboard shortcuts (`Cmd+K`) and integrations (GitHub, Slack). To make OpenGrove an intuitive, polished product without cluttering the minimalist UI, we will implement a subtle onboarding flow.

### Proposed UI Changes:
1. **Help & Shortcuts Dialog:** Add a persistent but subtle `?` button in the bottom-left of the sidebar (next to the user profile) that opens a beautiful `Cmd+K` cheat sheet and integration guide.
2. **Onboarding Empty State:** When a workspace is brand new (0 issues, 0 skills), display a polished "Getting Started" checklist in the center of the screen that explicitly guides users to:
   - Hit `Cmd+K` to create their first issue.
   - Connect their GitHub repo in Settings -> Integrations.
   - Define their first Skill in the Org Brain.
3. **Tooltips:** Implement native Shadcn/ui tooltips (`components/ui/tooltip.tsx`) on icon-only buttons (like sidebar nav items) so users aren't left guessing what things do.

---

---

## Phase 2: The Automations Engine

**Goal:** Build the "If This Then That" trigger dispatcher that connects system events (GitHub webhooks, Issue changes, Cron schedules) to OpenGrove's execution layer (Skills and Loops).

### User Review Required
> [!WARNING]
> Please review the Automations Engine design below, particularly how it bridges inbound events to `agentRuns` and `loops`.

### Proposed Changes

#### [MODIFY] `convex/schema.ts`
- **Tables**: `automations` and `agentRuns` already exist. No schema changes are strictly necessary here, as we will use `agentRuns` with the `automationId` set to track execution history.

#### [NEW] `convex/automations.ts`
- **CRUD Operations**: Implement standard `create`, `list`, `update`, `delete`, and `toggleEnabled` endpoints for the Automations UI.
- **`dispatchAutomation` (Action/Internal Mutation)**: The core entry point for triggers.
  - Takes the `automationId` and a generic `payload` (e.g., the GitHub PR object).
  - Checks if the Automation targets a **Skill** or a **Loop**.
  - **If Skill**: Creates an `agentRun` record and spins up a single inference via the `vectorAgent`, injecting the skill instructions and event payload. Passes down the `executionMode` (`suggest_only`, `draft`, `auto_execute`) to enforce tool safety.
  - **If Loop**: Invokes `startLoop` on the `loopOrchestrator` to kick off recursive execution.

#### [MODIFY] `convex/github.ts`
- Update the existing `handleGithubEvent` webhook sink.
- For supported events (`pull_request` opened/merged, `push`), query `ctx.db.query("automations").filter(enabled and matching triggerType)`.
- Loop through matches and call `dispatchAutomation` asynchronously via `ctx.scheduler.runAfter` to prevent webhook timeouts.

#### [NEW] `convex/cron.ts`
- Register Convex cron jobs that poll for `automations` with `triggerType === "cron"`.
- Dispatch them using `dispatchAutomation`.

#### [NEW] `app/(app)/[orgSlug]/automations/page.tsx`
- **Automations Dashboard**: A UI to list existing Automations, display their execution history (fetching from `agentRuns`), and toggle them on/off.
- Hook up the existing `CreateAutomationDialog`.

## Phase 2.5: Inbound Data Sync & Human-in-the-Loop Validation

**Goal:** Align with Dan Kearns' "Layer 01" philosophy. 
1. **Capture at Origination:** Add an `incoming_webhook` trigger to Automations, allowing raw data from Zoom, Slack, Email, and Docs to be routed to Agents for cleaning, deduping, and contextualization.
2. **Push to Source of Truth (with Human-in-the-Loop):** OpenGrove *is* the source of truth. But for uncertain external data, the Agent will use `executionMode: "draft"` or `"suggest_only"`. It will prepare the payload (e.g., drafted sub-issues from a Zoom call) and route it to an Inbox or as an Issue Comment for a human to validate. Once validated, it pushes to the board. The record becomes a byproduct of work, not a chore.

### Proposed Changes

#### [MODIFY] `convex/schema.ts`
- Add `incoming_webhook` to the `agentTriggerTypeValidator`.

#### [MODIFY] `convex/http.ts`
- Add secure webhook endpoints, for example:
  - `POST /api/incoming/:webhookToken`
  - `POST /api/webhook/:orgSlug/:automationId` (requiring `Authorization: Bearer <apiKey>`)
- This endpoint will query active `automations` and spawn `agentRuns` to process the raw data.

#### [MODIFY] `components/automations/create-automation-dialog.tsx`
- Add "Incoming Webhook (Zapier/Make)" to the Trigger dropdown.
- Update the UI to clearly indicate that `executionMode: "draft"` is the recommended setting for Human-in-the-Loop validation of external data.

#### [MODIFY] `app/(app)/[orgSlug]/automations/page.tsx`
- Add a UI element to display the Org's unique secure webhook URL.

---

## Phase 3: Agentic Feedback Loops (Orchestrator)

**Goal:** Implement the dynamic LLM orchestration logic that allows an agent to repeatedly execute a task, self-evaluate, and loop until success or a maximum iteration limit is hit. This realizes the "Loops over Prompts" philosophy.

### User Review Required
> [!WARNING]
> Please review the LLM Orchestrator design below. It dictates how the Action and Validation agents pass context between each other and how they consume your tokens.

### Open Questions
> [!IMPORTANT]
> 1. Should the `runLoop` orchestrator run entirely within a single Convex action execution (which has a timeout limit, but is simpler), or should it use `ctx.scheduler.runAfter` to queue the next iteration as a separate background job (which avoids timeouts and allows long-running loops like "wait for CI to pass")? *Recommendation: Use the scheduler pattern for async recursive loops to prevent timeouts on large codebases.*

### Proposed Changes

#### [MODIFY] `convex/schema.ts`
- **`loopRuns` table (NEW)**: We need a dedicated ledger for Loop Executions, as a single Loop Run will orchestrate *multiple* Agent Runs (Action Agent Run -> Validation Agent Run -> Action Agent Run...).
  - Fields: `orgId`, `loopId`, `status` (`running`, `succeeded`, `failed`, `stopped`), `currentIteration`, `maxIterations`, `startedAt`, `completedAt`, `resultSummary`, `error`.
- **`agentRuns` table**:
  - Add `loopRunId: v.optional(v.id("loopRuns"))` to tie individual LLM runs back to the parent loop.

#### [NEW] `convex/agent/loopOrchestrator.ts`
- **`startLoop` (Mutation)**: Initializes the `loopRuns` ledger record and schedules the first iteration.
- **`executeLoopIteration` (Action)**: The core recursive orchestration logic.
  1. **Fetch Context**: Load the Loop configuration, Action Skill, and Validation Skill.
  2. **Action Phase**: Spin up the `Action Agent` (using `@ai-sdk/openai` or `vectorAgent`). Inject the `actionSkill.content` as the system prompt. Inject previous validation feedback (if any) as user context.
  3. **Validation Phase**: Spin up the `Validation Agent`. Inject the `validationSkill.content` and the output/git-diff produced by the Action Agent. Ask it to return a structured JSON response: `{ "passed": boolean, "feedback": "string" }`.
  4. **Evaluation**:
     - If `passed === true`: Mark `loopRun` as `succeeded`.
     - If `passed === false` and `currentIteration < maxIterations`: Increment iteration count and schedule `executeLoopIteration` again, passing the feedback to the next Action Phase.
     - If `passed === false` and `currentIteration >= maxIterations`: Mark `loopRun` as `failed` (Max Iterations Reached).

#### [NEW] `convex/loops.ts`
- Standard CRUD operations (`create`, `list`, `get`, `update`, `delete`) for managing Loop definitions.

#### [NEW] `app/(app)/[orgSlug]/loops/page.tsx`
- **Loops Dashboard**: A UI to create new Loops (selecting Action and Validation skills) and view the status of active and historical Loop Runs.

#### [MODIFY] `components/shell/app-sidebar.tsx`
- Add the `Loops` navigation link to the sidebar (if missing).

## Phase 4: Code-aware GitHub Tools

**Goal:** Implement a set of secure, code-aware GitHub tools for the AI Agent, allowing it to inspect code, analyze pull requests, and write code review comments.

### GitHub Token Strategy
**Correction: Clerk is still required and remains the primary authentication, organization, membership, and billing layer for OpenGrove.**

**Architecture rules:**
- Use Clerk for OpenGrove user authentication, organization membership, roles, sessions, and user-initiated setup flows.
- Use GitHub App installation tokens for server-side GitHub operations, background jobs, automations, loops, PR reviews, merge queue actions, branch operations, CI polling, and webhook-driven work.
- Clerk OAuth GitHub tokens may be used for user-initiated convenience actions, such as importing repositories during onboarding, but must not be used as the foundation for autonomous or background GitHub operations.
- Never select "the first org member" and use their OAuth token for background GitHub access.

When an agent needs background GitHub access:
1. Resolve the OpenGrove org.
2. Resolve the connected repo.
3. Look up the GitHub App installation for that org/repo.
4. Generate a short-lived installation access token (via `convex/agent/githubApp.ts`).
5. Execute the GitHub API operation.
6. Log the operation under the OpenGrove Agent / system actor in `agentRunSteps`.

### Proposed Tools to add in `convex/agent/tools.ts`
All tools will be registered under `vectorTools` so they are discoverable by the AI Agent.

1. **`fetchPRDiff`**:
   - Inputs: `repoName` (string), `prNumber` (number)
   - Function: Fetches raw git diff of a pull request.
2. **`fetchChangedFiles`**:
   - Inputs: `repoName` (string), `prNumber` (number)
   - Function: Fetches a list of changed files in the PR with addition/deletion counts.
3. **`fetchFileContent`**:
   - Inputs: `repoName` (string), `path` (string), `ref` (optional string)
   - Function: Fetches content of a specific file.
4. **`searchRepoCode`**:
   - Inputs: `repoName` (string), `query` (string)
   - Function: Searches code in the repository.
5. **`mapPRToIssues`**:
   - Inputs: `repoName` (string), `prNumber` (number)
   - Function: Scans PR commits/descriptions, extracts issue keys (e.g. `ENG-123`), and returns matching issues from the DB.
6. **`analyzePRRisk`**:
   - Inputs: `repoName` (string), `prNumber` (number)
   - Function: Analyzes PR changes (like package configuration updates or critical files) and returns a risk score/summary using LLM analysis.
7. **`postPRComment`**:
   - Inputs: `repoName` (string), `prNumber` (number), `body` (string)
   - Function: Posts a comment/review on the GitHub Pull Request.

## Phase 5: Semantic GitHub Sync & Suggestions Inbox (COMPLETED)

**Goal:** Implement semantic GitHub event linking, the AI suggestions inbox review layer, and real GitHub timeline events.

### Prerequisites (Completed)
- Ensure issues have embedding fields and a vector index.
- Backfill embeddings for existing issues.
- Generate/update embeddings when issue title/description changes.

### Centralized Configuration
- Centralized thresholds in a new config file `convex/lib/githubConfig.ts`:
  - `AUTO_LINK_THRESHOLD = 0.85`
  - `SUGGESTION_THRESHOLD = 0.65`
  - Matches below `0.65` are logged and ignored.

### Database Schema Mappings in `convex/schema.ts`
- Add `aiSuggestions` table:
  - `orgId`: `v.id("organizations")`
  - `issueId`: `v.id("issues")`
  - `repoName`: `v.string()` (matches `connectedRepos.repoName`)
  - `repoId`: `v.optional(v.id("connectedRepos"))`
  - `prNumber`: `v.optional(v.number())`
  - `commitSha`: `v.optional(v.string())`
  - `confidence`: `v.number()`
  - `reason`: `v.string()` (structured explanation of matching criteria: PR title, changed files, semantic similarity, related issue excerpts)
  - `status`: `v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("expired"))`
  - `idempotencyKey`: `v.string()` (e.g., `orgId + repoName + prNumber/commitSha + issueId`)
  - `createdAt`: `v.number()`
  - `reviewedBy`: `v.optional(v.id("users"))`
  - `reviewedAt`: `v.optional(v.number())`
  - Indexes:
    - `by_org_and_status` on `["orgId", "status"]`
    - `by_idempotency` on `["orgId", "idempotencyKey"]`

### Backend Process Flow

#### 1. Inbound Webhook (`convex/github.ts`)
- Parse the webhook. If no explicit issue key is found:
  - Check if we've already processed this delivery or PR/commit via idempotency checks.
  - Call OpenAI embedding model to generate the vector for the PR (title + description + files changed).
  - Search `issues` by embedding with vector search (`by_embedding` index).
  - Filter out issues that are already linked or resolved.
  - Calculate semantic confidence scores.
  - **High confidence (>= 0.85)**: Trigger direct PR linking mutation.
  - **Medium confidence (0.65 - 0.85)**:
    - Check if a `rejected` suggestion already exists for this PR-Issue combination. If yes, skip to prevent annoyance.
    - Create a pending `aiSuggestions` record with idempotency checks.
  - **Low confidence (< 0.65)**: Ignore / log.

#### 2. AI Suggestions CRUD (`convex/aiSuggestions.ts`)
- `listPendingSuggestions`: Queries pending suggestions for the active org.
- `approveSuggestion`: Transitions status to `accepted`, triggers the issue PR link mutation (updating issue status & inserting PR activity comment in `comments` table), and sets reviewer metadata.
- `rejectSuggestion`: Transitions status to `rejected`, ensuring it is persisted so it won't be suggested again.

#### 3. Pending Suggestions Badge
- Create a query `pendingSuggestionsCount` in `convex/aiSuggestions.ts`.
- Update `components/shell/app-sidebar.tsx` to call this query and render a small count badge next to the AI Agent / Inbox navigation if greater than 0.

#### 4. Suggestions Inbox UI (`app/(app)/[orgSlug]/inbox/page.tsx`)
- Render a dedicated suggestions review dashboard with cards for each match.
- Display explanation fields, confidence badges, and actionable "Approve" and "Ignore" buttons.

---

## Verification Plan
- **Test Case 1 (Explicit Link)**: Open PR with PR title containing `ENG-1` -> links automatically and updates status.
- **Test Case 2 (Semantic Link - High Confidence)**: Open PR with semantic title matched to an issue -> auto-links directly.
- **Test Case 3 (Semantic Link - Medium Confidence)**: Open PR with medium match -> creates inbox suggestion with explanation.
- **Test Case 4 (Approved Suggestion)**: Approve suggestion in UI -> PR gets linked, timeline updates.
- **Test Case 5 (Rejected Suggestion)**: Reject suggestion in UI -> persists as rejected; duplicate webhook delivery does not recreate it.
- **Test Case 6 (Idempotency)**: Deliver duplicate webhooks -> no duplicate suggestions or activity logs.

---

### Open Questions
> [!IMPORTANT]
> 1. **Schema Modifications:** `mergeQueueItems` and `mergeBatches` are approved for Phase 6. I will add them when I start Phase 6.
> 2. **CI Webhooks vs Polling:** We will use GitHub `check_suite`, `check_run`, or `status` webhooks for real-time updates, and add a low-frequency Convex cron reconciliation job as fallback for missed webhook events.
> 3. **Conflict Detection:** V1 will use deterministic file-overlap checks. If two PRs touch the same file, they cannot be batched together. LLM conflict analysis can be added later as advisory risk metadata only.

### Proposed Changes

#### Schema
- **[MODIFY] `convex/schema.ts`**:
  - Add `mergeQueueItems`: `orgId`, `repoId` (string, full name), `prNumber`, `status` (queued, batched, testing, merged, failed), `batchId` (optional), `addedAt`, `processedAt`.
  - Add `mergeBatches`: `orgId`, `repoId`, `branchName`, `prNumbers` (array), `status` (creating, testing, passed, failed, merged), `createdAt`, `completedAt`.

#### Backend Actions
- **[NEW] `convex/mergeQueue.ts`**:
  - `enqueuePR`: Adds a PR to the queue.
  - `processQueue`: Internal action that groups non-conflicting PRs, creates an integration branch, merges PR branches into it, and updates statuses.
  - `handleBatchStatus`: Processes CI successes/failures. For V1, it will **require human approval** before merging into main, instead of auto-merging.
- **[MODIFY] `convex/github.ts`**:
  - Update `handleGithubEvent` to listen for `check_run` or `status` events (if we go the webhook route).
- **[NEW] `convex/agent/mergeTools.ts`**:
  - Add GitHub API helpers for creating branches, merging branches, and polling CI statuses using the Clerk OAuth token approach.

#### Frontend UI
- **[NEW] `app/(app)/[orgSlug]/merge-queue/page.tsx`**:
  - A dashboard to view queued PRs, active batches, and historical batch runs.
- **[MODIFY] `components/shell/app-sidebar.tsx`**:
  - Add a navigation link to the Merge Queue page.

### Verification Plan
- **Test Case 1**: Enqueue 3 non-conflicting PRs. The system should group them, create an integration branch, and merge them all cleanly.
- **Test Case 2**: Enqueue 2 conflicting PRs (touching the same file). The system should isolate them into separate batches.
- **Test Case 3**: Simulate a failed integration merge. The system should rollback, isolate the failing PR, and recreate the batch for the remaining PRs.
