# Tasks: Phase 1 — Skills Registry + Execution Ledger

## Schema Migration
- [x] Add `skills` table to `convex/schema.ts`
- [x] Add `apiKeys` table to `convex/schema.ts`
- [x] Add `agentRuns` table to `convex/schema.ts`
- [x] Add `agentRunSteps` table to `convex/schema.ts`

## Backend: Skills Registry
- [x] Create `convex/skills.ts` — CRUD (list, create, update, delete, getBySlug)
- [x] Add skill type/scope validators to schema
- [x] Integrate skills into agent runtime (vectorAgent queries active skills)

## Backend: API Keys
- [x] Create `convex/apiKeys.ts` — create (with hash), list, revoke

## Backend: Execution Ledger
- [x] Create `convex/agentRuns.ts` — createRun, updateRunStatus, addStep, listRuns

## External Skills API
- [x] Add `/api/skills` HTTP route to `convex/http.ts`
- [x] Add `/api/context` HTTP route to `convex/http.ts`
- [x] API key verification middleware

## Frontend: Skills Registry UI
- [x] Create `app/(app)/[orgSlug]/skills/page.tsx`
- [x] Create skill list/card components
- [x] Create skill create/edit form
- [x] Add Skills nav link (command palette entry)

## Frontend: API Keys Management
- [x] Add API Keys section to settings page

## Verification
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm lint` passes
- [x] Tested Skill UI visually

# Tasks: Phase 1.5 — UX Polish & Onboarding

## Help & Shortcuts
- [x] Create `components/shell/help-dialog.tsx` (Cmd+K guide, links to integrations)
- [x] Add `?` button to `components/shell/app-sidebar.tsx`

## Tooltips
- [x] Wrap sidebar nav items in `Tooltip` component

## Onboarding Empty State
- [x] Update board/issue list to show "Getting Started" checklist when 0 issues exist

# Tasks: Phase 3 — Agentic Feedback Loops (Orchestrator)
- [x] Add `loopRuns` table and `loopRunId` to `agentRuns` in `convex/schema.ts`
- [x] Implement `convex/loops.ts` for Loop CRUD
- [x] Implement `convex/agent/loopOrchestrator.ts` (startLoop, executeLoopIteration)
- [x] Build `app/(app)/[orgSlug]/loops/page.tsx` UI
- [x] Update `components/automations/create-automation-dialog.tsx` to target Loops

# Tasks: Phase 2 — The Automations Engine

## Schema
- [x] Add `automations` table to `convex/schema.ts`
- [x] Use existing `agentRuns` table for automation executions

## Backend
- [x] Create `convex/automations.ts` (CRUD)
- [x] Update `convex/github.ts` (Webhook Handler) to trigger automations on events

## Frontend UI
- [x] Create `app/(app)/[orgSlug]/automations/page.tsx`
- [x] Add "Automations" link to the settings/workspace navigation
- [x] Build the "If This Then That" creation dialog

## Verification
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm lint` passes

# Tasks: Phase 3 — Agentic Feedback Loops

## Database Schema
- [x] Add `loops` table to `convex/schema.ts`

## Backend
- [x] Create `convex/loops.ts` for CRUD operations

## Frontend UI
- [x] Add "Loops" link to `app-sidebar.tsx`
- [x] Create `components/loops/create-loop-dialog.tsx`
- [x] Create `app/(app)/[orgSlug]/loops/page.tsx`
- [x] Update Automations UI to allow triggering a Loop

## Verification
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm lint` passes

# Tasks: Phase 4 — Code-aware GitHub Tools

## Integration Helpers
- [x] Create `getGithubToken` in `convex/agent/tools.ts` to retrieve user/org tokens from Clerk

## Agent Tools
- [x] Implement `fetchPRDiff` tool
- [x] Implement `fetchChangedFiles` tool
- [x] Implement `fetchFileContent` tool
- [x] Implement `searchRepoCode` tool
- [x] Implement `mapPRToIssues` tool
- [x] Implement `analyzePRRisk` tool
- [x] Implement `postPRComment` tool

## Verification
- [x] `pnpm exec tsc --noEmit` passes
- [x] `pnpm lint` passes
