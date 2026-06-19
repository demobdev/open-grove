# Walkthrough: Phase 6 - Agentic Merge Queue

I have completed the implementation of Phase 6: Agentic Merge Queue. This phase introduces deterministic file-overlap checks and an integration branch system to queue and test Pull Requests together before merging, enforcing a "human-in-the-loop" approval flow as requested.

## What was implemented

### Database Schema Updates
Added two new tables to `convex/schema.ts`:
- **`mergeQueueItems`**: Tracks individual PRs added to the queue (`orgId`, `repoId`, `prNumber`, `status`, `batchId`).
- **`mergeBatches`**: Groups non-overlapping PRs into an integration branch to be tested together.

### Merge Queue Backend Core (`convex/mergeQueue.ts`)
- **`enqueuePR`**: Idempotent mutation to add PRs to the queue.
- **`processQueue`**: An internal action that calculates file overlaps across queued PRs, groups non-overlapping PRs, creates an integration branch off `main`, merges the PRs into the branch, and transitions the database states.
- **`handleBatchStatus`**: Processes CI webhook updates to mark batches as `passed` (ready for manual merge) or `failed`.

### GitHub App Architecture (`convex/agent/githubApp.ts`)
- Created `generateGitHubAppJWT` and `getInstallationTokenForRepo` utilities utilizing `jose` to properly authenticate via the GitHub App private key, bypassing the Clerk OAuth flow for all automated server-side PR operations.

### Agent Tooling (`convex/agent/mergeTools.ts`)
- Exposes `inspectBatch` and `triggerProcessQueue` to allow the agent to detect conflicts via the GitHub API and re-run queue processing manually.

### External CI Hook Interception (`convex/github.ts`)
- Modified the main `handleGithubEvent` webhook sink to parse GitHub `check_run` and `status` payload events on the `og-merge-batch-*` integration branches. 

### Frontend UI
- **[Merge Queue Dashboard](file:///c:/Users/Demo%20Bailey/open-grove/app/%28app%29/%5BorgSlug%5D/merge-queue/page.tsx)**: Built a Shadcn-based dashboard to visualize current Queued PRs and Recent Batches. 
- **[Sidebar Navigation](file:///c:/Users/Demo%20Bailey/open-grove/components/shell/app-sidebar.tsx)**: Registered the `Merge Queue` link using the `<GitMerge>` icon.

## Verification
- Run `pnpm run dev` and navigate to the Workspace sidebar.
- Click **Merge Queue** to verify the dashboard layout renders successfully.
- Webhooks will now automatically intercept branch `check_run` payloads to finalize batch states.

## Walkthrough: Phase 3 - Agentic Feedback Loops (Orchestrator)

I have implemented the core LLM Orchestration engine that powers "Loops over Prompts". This enables agents to automatically self-evaluate their work against an objective and retry until successful.

### Database Updates
- Added the `loopRuns` table to `convex/schema.ts` to act as the execution ledger for loop tracking.
- Appended `loopRunId` to the existing `agentRuns` schema so individual LLM inferences can be traced back to the parent loop.

### The Orchestrator (`convex/agent/loopOrchestrator.ts`)
Built a recursive background-job architecture using `ctx.scheduler` to bypass HTTP timeout limits for massive codebases:
1. **`startLoop`**: Initializes the ledger and triggers the first iteration asynchronously.
2. **`executeLoopIteration`**: 
   - **Action Phase**: Dynamically loads the `actionSkill.content` and passes it to the agent, alongside any feedback from previous iterations.
   - **Validation Phase**: Invokes a separate evaluation prompt using `validationSkill.content`.
   - **Recursion**: If validation fails, it safely increments the `currentIteration` counter and reschedules itself via `ctx.scheduler.runAfter` with the new feedback string. It safely terminates when `maxIterations` is breached.

### Frontend Updates
- Built the **Loops Dashboard** at `app/(app)/[orgSlug]/loops/page.tsx`. You can now see the pairing of Action Skills and Validation Skills visually.
- Wired up a manual **Run Now** button that dispatches `startLoop` so loops can be manually triggered and tested outside of Automations.
- Verified that the `CreateAutomationDialog` natively supports targeting `Loops` as execution targets rather than just singular Skills!
