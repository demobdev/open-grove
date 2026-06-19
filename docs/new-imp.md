This architectural roadmap outlines a strategic transition for OpenGrove, moving it from a simple AI-enhanced tool to a sophisticated coordination layer for agentic software workflows. The author advocates for a rigorous platform architecture that prioritizes a structured schema, durable execution ledgers, and GitHub App integration to ensure the system is scalable and secure rather than a collection of superficial features. Key themes include the distinction between event-driven automations and goal-oriented loops, alongside the implementation of approval gates and scoped skills to maintain human oversight of autonomous actions. By establishing a Skills API and a meticulous five-phase build order, the plan aims to transform the product into a "mission control" center that manages the entire lifecycle of code development with high auditability and trust.











Yes — this is close. But I’d make it stricter. Right now the plan has the right product pillars, but it needs more platform architecture discipline so OpenGrove doesn’t become “Linear with some AI buttons duct-taped on.”
Here’s what I’d tweak.
The plan is strong because it correctly identifies the moat
The real advantage is not:
“OpenGrove has an AI agent.”
Everybody will have that. Boring. Table stakes.
The advantage is:
OpenGrove becomes the coordination layer between issues, code, agents, org rules, automations, reviews, and merges.
That is the part competitors struggle with because they are usually one slice of the workflow:
Linear = planning Cursor / Claude Code = local execution CodeRabbit = PR review Greptile = code intelligence GitHub Actions = CI Slack = noisy updates Custom scripts = glue spaghetti
OpenGrove’s move is to own the closed loop:
Issue → skill context → agent action → PR → review → merge queue → status sync → analytics → next loop
That’s the product. That’s the “mission control” angle.
⸻
What I would change architecturally
Do the controlled schema migration. No hacks.
NotebookLM is right here.
Do not store skills, loops, or automations inside views.filters.
That is prototype goblin behavior. Fine for a weekend demo, bad for a product.
You need proper Convex tables for:
skills automations automationRuns loops loopRuns apiKeys githubInstallations agentRuns agentRunSteps auditLogs
Maybe not all in the first PR, but the architecture should be designed around them.
The minimum Phase 1 schema should include:
skills automations automationRuns loops loopRuns apiKeys
Then Phase 2 adds:
githubInstallations agentRuns agentRunSteps mergeQueueItems
The reason: agent systems need history. Without run logs, retries, permissions, and audit records, debugging becomes “the robot did something weird again.” Not a product. A haunted Roomba.
⸻
GitHub App is mandatory, not optional.
The plan currently says GitHub App or PAT.
Make that decision now:
Use GitHub App installations as the canonical server-side auth model.
A PAT is okay for a local prototype, but not for OpenGrove’s actual SaaS architecture.
You need GitHub App support because background loops need access when no user is online. Also, orgs need permission boundaries, repo-level installs, webhook delivery, and revocation.
Recommended GitHub model:
GitHub App Installation → orgId → installationId → connectedRepos[] → permissions → webhook secret → installation access token generated on demand
Do not store long-lived GitHub user tokens as the foundation for autonomous behavior. Use short-lived installation tokens when jobs run.
⸻
Add a real execution ledger
This is the biggest missing piece.
If OpenGrove is going to run automations and loops, every agent action needs a durable trail.
You need an agentRuns concept.
Example:
agentRuns: { orgId, teamId, issueId?, automationId?, loopId?, skillIds: Id<"skills">[], triggerType: "manual" | "github_pr_opened" | "github_push" | "cron" | "issue_status_changed", status: "queued" | "running" | "needs_approval" | "succeeded" | "failed" | "cancelled", startedAt, completedAt, summary, error, createdByUserId?, }
And agentRunSteps:
agentRunSteps: { runId, stepIndex, toolName, input, outputSummary, status, startedAt, completedAt, error, }
This gives you:
a Loops dashboard that actually shows what happened
auditability for teams
debugging for failed runs
replay/retry support
future billing/metering
trust
This should be treated as core infrastructure, not polish.
⸻
Add approval gates before dangerous actions
The plan mentions agents doing PR reviews, posting comments, and eventually pushing fixes.
Good. But don’t let autonomous agents immediately mutate production workflows without approval modes.
Every automation/loop should have an execution mode:
mode: "suggest_only" | "draft" | "auto_execute"
For example:
Action Default Mode Suggest labels Auto Link PR to issue Auto Move issue status Auto or configurable Post Slack update Auto Comment on PR Suggest/draft first Create issue Auto with limits Push code change Approval required Merge PR Approval required until trust is earned
This matters for enterprise trust. The product should feel powerful, not like it found the launch codes.
⸻
Skills need types, scopes, and precedence
The Skills Registry should not just be “saved prompts.”
That’s too weak.
Make skills structured.
Example skill model:
skills: { orgId, name, slug, description, type: "review" | "triage" | "docs" | "security" | "style" | "release" | "custom", scope: { repoIds?: Id<"connectedRepos">[], teamIds?: Id<"teams">[], projectIds?: Id<"projects">[], fileGlobs?: string[], }, content, priority, isEnabled, version, createdBy, updatedAt, }
Why this matters:
A frontend repo has different rules from a backend repo.
A security review skill should not run on every copy change.
A docs sweep skill should care about README, docs, *.md, maybe API routes.
A design system skill may only apply to components/ui/**.
The Skills Registry becomes powerful when it is not one big blob of prompt soup.
⸻
Add external Skills API, but secure it correctly
Yes, this is missing and it is important.
OpenGrove should expose org skills to external agents:
GET /api/skills GET /api/skills?repo=owner/name GET /api/skills?team=engineering GET /api/context?issue=OG-123
But don’t just toss an API key on it and call it done.
You need:
apiKeys: { orgId, name, keyHash, prefix, scopes: string[], createdBy, lastUsedAt, revokedAt?, }
Example scopes:
skills:read issues:read issues:write agent_runs:create repo_context:read
This becomes your bridge into Cursor, Claude Code, local scripts, GitHub Actions, and future MCP servers.
Eventually, this can become:
“OpenGrove MCP Server: your issue tracker, org brain, and repo workflow exposed to every coding agent.”
That is a serious strategic move.
⸻
Automations and Loops should be separate concepts
The plan kind of groups them together. They are related, but they are not the same.
Automations
Event-driven.
When X happens → do Y
Examples:
When PR opens → run review skill When issue moves to Done → notify Slack When duplicate issue detected → create suggestion
Loops
Goal-driven and recurring.
Every interval → inspect state → decide whether action is needed → act/log
Examples:
Every night → compare commits to docs → create docs issues Every morning → summarize team activity Every 6 hours → check stale issues
I’d make this explicit in the architecture.
Use different tables, different UI mental models, and different execution semantics.
⸻
Add idempotency and deduplication
This is boring infrastructure. It is also the difference between “works” and “oh no.”
Webhook systems retry. Cron jobs can overlap. Agents can create duplicates.
Every automation run should have an idempotency key:
orgId + automationId + triggerType + externalEventId
For GitHub:
github_delivery_id
For issue events:
issueId + statusChangedAt + automationId
For cron:
loopId + scheduledWindowStart
Without this, you will eventually create five Slack posts, three duplicate issues, and one very annoyed user named Chad from engineering.
⸻
Add a permissions model now
Before agents can do real work, you need to answer:
What is this agent allowed to do?
Minimum permission layers:
Org role Team membership Plan tier Repo installation permissions Automation mode Skill scope API key scope
For example:
A Pro org can run nightly duplicate scans, but PR review loops may be Enterprise.
A user may create skills but not enable auto-merge.
An API key may read skills but not create issues.
This should be baked in before the Automation Engine gets too far.
⸻
Add billing/metering architecture early
You already have plans and rate limiting. Good.
But loops and automations need usage tracking.
Track:
agent messages tool calls automation runs loop runs embeddings generated GitHub API calls PR reviews external API requests
You do not need to charge for all of it immediately, but you need to measure it.
Suggested plan gates:
Feature Free Pro Enterprise Manual AI chat Limited Higher Unlimited/custom Skills Registry 3 skills Unlimited Unlimited + governance Automations 1-3 Unlimited-ish Advanced Loops None or 1 demo Several Custom schedules PR Review Loop No Limited Full Merge Queue No Maybe beta Full External API No Limited Full
⸻
The build order I’d use
I would not start with the merge queue yet.
The merge queue is the sexiest feature, but it depends on too much infrastructure. Build the nervous system first.
Phase 1: Foundation
Build:
skills apiKeys agentRuns agentRunSteps
UI:
Skills Registry page Agent Run detail page
Why first?
Because every other feature needs skills and execution logs.
⸻
Phase 2: Automations
Build:
automations automationRuns trigger dispatcher issue event hooks GitHub webhook trigger mapping Slack notification action
Start with safe actions:
label suggestion duplicate suggestion PR linked notification Slack summary issue status update
Avoid code mutation for now.
⸻
Phase 3: Loops
Build:
loops loopRuns cron scheduler loop dashboard
Ship 3 built-in loops:
Duplicate Radar Issue Staleness Sweep Morning Standup Summary
Then add:
Overnight Docs Sweep
Docs sweep requires more repo/code awareness, so it is slightly harder.
⸻
Phase 4: Code-aware GitHub tools
Add agent tools:
fetchPRDiff fetchChangedFiles fetchFileContent searchRepoCode mapPRToIssues analyzePRRisk postPRComment
This unlocks CodeRabbit/Greptile territory.
⸻
Phase 5: Agentic Merge Queue
Only now build:
mergeQueueItems file conflict detection batch grouping integration branch creation CI status tracking merge execution rollback/failure reporting
This is where the moat gets nasty.
⸻
What I’d add to the plan
Here’s the clean addendum I would give the coding agent.
OpenGrove v2 Implementation Addendum
Core Architecture Decisions
Controlled Schema Migration Required
Do not use views.filters, comments, activity records, or file storage as a workaround for core product entities.
OpenGrove v2 requires dedicated Convex tables for the new agentic execution layer. Add strongly typed tables for:
skills
automations
automationRuns
loops
loopRuns
apiKeys
agentRuns
agentRunSteps
Later phases may add:
githubInstallations
mergeQueueItems
auditLogs
These entities are foundational product infrastructure and should not be encoded into unrelated tables.
⸻
GitHub App Architecture Is Required
Use a GitHub App installation model for all server-side and background GitHub access.
Do not rely on Personal Access Tokens for autonomous loops, scheduled jobs, PR review, or merge queue functionality.
The GitHub integration should support:
organization-level installations
repo-level permissions
installation IDs mapped to OpenGrove orgs
short-lived installation access tokens generated on demand
webhook event verification
revoked/suspended installation handling
This is required for secure B2B SaaS usage and for background jobs that run without an active user session.
⸻
Add an Agent Execution Ledger
All agent, automation, and loop activity must be recorded.
Add agentRuns and agentRunSteps so the system can show:
what triggered the agent
which skills were used
which tools were called
what actions were suggested or executed
whether the run succeeded, failed, or requires approval
error messages and retry status
This execution ledger powers the Loops Dashboard, debugging, auditability, billing, and user trust.
⸻
Skills Registry Must Be Structured
Skills are not just saved prompts.
Each skill should include:
name
slug
description
type
scope
content
priority
enabled/disabled status
version
createdBy
updatedAt
Supported skill types should include:
triage
review
docs
security
style
release
custom
Skill scope should support:
org-wide
team-specific
repo-specific
project-specific
file glob-specific
Agents should retrieve only the relevant active skills for the current task context.
⸻
External Skills API Is Required
The Skills Registry must expose secure API endpoints so external coding agents and local tools can fetch org context.
Initial endpoints:
GET /api/skills
GET /api/skills?repo=<repo>
GET /api/skills?team=<team>
GET /api/context?issue=<issueKey>
Use API keys with hashed storage and scoped permissions.
Suggested scopes:
skills:read
issues:read
issues:write
repo_context:read
agent_runs:create
This API is a key strategic differentiator because it turns OpenGrove into the shared context layer for Cursor, Claude Code, GitHub Actions, local scripts, and future MCP integrations.
⸻
Separate Automations From Loops
Automations and loops are related but distinct.
Automations are event-driven:
When X happens, do Y.
Examples:
PR opened → run review skill
issue created → run triage skill
issue status changed → notify Slack
PR merged → move issue to Done
Loops are recurring and goal-driven:
On a schedule, inspect the workspace, decide if action is needed, then act or report.
Examples:
nightly duplicate radar
morning standup summary
stale issue sweep
overnight docs sweep
Use separate tables and UI surfaces for these concepts.
⸻
Add Approval Modes
Every automation and loop should support execution modes:
suggest_only
draft
auto_execute
Dangerous actions should default to approval-required.
Examples:
posting suggestions: safe
linking PRs: safe
moving issues: configurable
commenting on PRs: draft/suggest first
pushing code: approval required
merging PRs: approval required until enterprise controls exist
⸻
Add Idempotency
Every automation and loop run needs idempotency protection.
Use idempotency keys based on trigger source:
GitHub webhook: github_delivery_id + automationId
issue event: issueId + eventTimestamp + automationId
cron loop: loopId + scheduledWindowStart
This prevents duplicate Slack posts, duplicate issues, duplicate PR comments, and repeated agent actions.
⸻
Add Permission and Plan Gates
Before agents can perform real work, enforce:
org role permissions
team membership
repo installation access
API key scopes
automation execution mode
plan limits
Plan gates should eventually distinguish Free, Pro, and Enterprise access for:
number of skills
number of automations
number of loops
external API access
PR review loops
merge queue usage
agent run limits
⸻
Recommended Build Order
Phase 1: Skills + Execution Ledger
Build first:
skills
apiKeys
agentRuns
agentRunSteps
Skills Registry UI
External Skills API
agent skill retrieval
This creates the Org Brain and gives all future agent activity a durable audit trail.
## Phase 1.5: UX Polish & Onboarding (NEW)

The orchestration layer relies heavily on keyboard shortcuts (`Cmd+K`) and integrations. To make OpenGrove an intuitive, polished product without cluttering the minimalist UI, we will implement a subtle onboarding flow.

### `app/(app)/[orgSlug]/layout.tsx` or `components/shell/workspace-shell.tsx`
- **Help/Shortcuts Menu:** Add a persistent but subtle "Help" icon (or `?` button) in the bottom-left of the sidebar that opens a beautiful `Cmd+K` cheat sheet and connection guide.
- **Empty States:** When the board is empty, show a polished "Getting Started" empty state that explicitly guides users to:
  1. Press `Cmd+K` to create an issue.
  2. Visit **Settings > Integrations** to connect their GitHub repo.
  3. Visit **Settings > API Keys** to configure their agents.

### `components/ui/tooltip.tsx`
- Implement Shadcn/ui tooltips globally on key icon-only buttons so users aren't left guessing.

---

## Phase 2: The Automations Engine (Webhook Triggers)
Build next:
automations
automationRuns
trigger dispatcher
GitHub webhook trigger mapping
issue event hooks
Slack notification action
safe issue update actions
Start with suggestion and notification workflows before enabling code mutation.
Phase 3: Loops Dashboard
Build next:
loops
loopRuns
cron-backed loop runner
loop dashboard
run detail view
Ship built-in loops:
Duplicate Radar
Issue Staleness Sweep
Morning Standup Summary
Overnight Docs Sweep
Phase 4: Code-aware GitHub Tools
Add agent tools:
fetchPRDiff
fetchChangedFiles
fetchFileContent
searchRepoCode
mapPRToIssues
analyzePRRisk
postPRComment
These tools unlock PR review and code-aware automations.
Phase 5: Agentic Merge Queue
Build after the GitHub tools and automation engine are stable.
Add:
mergeQueueItems
file-level conflict detection
conflict-free PR batching
integration branch creation
CI status tracking
batch merge execution
failure rollback/reporting
The merge queue is the long-term strategic moat, but it depends on the previous phases.
⸻
One more strategic feature I’d consider adding
“Agent Contracts”
This could become a nasty differentiator.
An Agent Contract is a structured agreement between OpenGrove and any agent doing work.
Example:
For this issue, the agent is allowed to:
read repo files
create a branch
modify files under /components and /app
open a PR
request review The agent is not allowed to:
edit billing code
modify auth middleware
change database schema
merge to main
touch environment variables
That gives OpenGrove a unique role:
OpenGrove does not just assign work to agents. It gives them scoped permission to act safely.
That’s huge.
This could later connect to:
skills
issue types
repo paths
GitHub branch protections
API keys
merge queue policies
That’s how you go from “AI issue tracker” to “agent operating system for software teams.”
⸻
My final recommendation
Tell the coding agent:
Approve the vision.
Reject schema hacks.
Mandate GitHub App architecture.
Add Skills API for external agents.
Add execution ledger before loops.
Separate automations from loops.
Add approval modes, idempotency, and permissions.
Build Skills + Agent Runs first, not Merge Queue first.
The plan is good. With these changes, it becomes real architecture instead of a vibes roadmap with a cape.
Chat
🕹️
OpenGrove: The Mission Control for Agentic Development
6 sources
·
Jun 18, 2026
OpenGrove is presented as a specialized management platform designed to unify the currently fragmented landscape of AI-driven software development. The system acts as a centralized execution layer that coordinates various tools, such as planning trackers and code editors, into a seamless workflow. By introducing a native Agent Merge Queue, the platform resolves common deployment bottlenecks and reduces costs by batching parallel code contributions. Additionally, it features an Active Loops Dashboard that allows teams to automate recurring tasks like bug fixes and documentation updates without manual scripting. The suite further enhances organization through a Skills Registry, which serves as a shared repository for standardized prompts and security protocols. Ultimately, OpenGrove aims to serve as the mission control for engineering teams scaling their use of autonomous coding agents.

How does the Agentic Merge Queue solve the commit lock problem?
Explain how businesses use Active Loops for automated error mitigation.
What are the main benefits of a centralized Skills Registry?
Today • 9:59 PM
Edited loops-tools-skills.md
Viewed loops-tools-skills.md:214-216
Edited agentic_workflow_pitch.md


I have analyzed the transcript and created a tailored product vision document: agentic_workflow_pitch.md.


The Core Synthesis

While code-indexing tools (Greptile) and review tools (CodeRabbit) are great individual utilities, developers are struggling with tool fragmentation and the unsolved parallel-agent merge bottleneck (as described in Chapter 11). OpenGrove can become a unified suite that solves this for both solo hackers and large companies.


3 Key Pillars of the OpenGrove Suite:


The Agentic Merge Queue: OpenGrove acts as the git traffic controller. It checks PRs for file conflicts, batches conflict-free branches into a single integration branch, runs CI once, and merges them in a batch. This reduces Vercel/GitHub build minutes (saving money for hackers) and prevents commit locks.

Native Loop Harness (Developer Crons): A dashboard to deploy and monitor continuous task loops (e.g. "Overnight docs sweep," "Production error log sweep") running directly on our cloud infrastructure, linking issues directly to code generation.

Centralized Skills & Tool Registry: A single API endpoint that serves your organization's prompt rules, API tokens, and code review criteria to any external agent (Cursor, Claude Code, etc.) in the workspace.

The product vision document perfectly captures OpenGrove's positioning as the mission control and execution layer for the agentic coding era
. By addressing the fragmented developer ecosystem—which currently relies on messy custom scripts and webhooks to stitch together issue trackers, IDEs, and CI/CD pipelines—OpenGrove has a clear competitive edge
.
Your three pillars directly solve the major pain points highlighted in the sources:
The Agentic Merge Queue: This perfectly targets the "commit lock" issue where multiple parallel agents bottleneck at the git and deploy level
. By batching conflict-free PRs into a single integration branch and running CI just once, this feature unblocks parallel agent output and can cut GitHub Actions and Vercel build costs by up to 80%
.
Native Loop Harness: Addressing the manual cron setups from Chapter 7, running these automated threads natively on Convex cloud infrastructure will effectively turn the user's issue tracker into a live agent runtime environment
.
Centralized Skills Registry: This resolves the Chapter 5 problem of scattered .cursorrules or local setups by providing a team-wide single source of truth for guidelines, security boundaries, and API schemas to all external agents
.
Looking ahead at the High-Impact Feature Backlog, since Phase 5 (Semantic Webhook auto-linking) is already complete, your immediate next step is Phase 6: The Merge Queue
. This will require building the Convex mutations and background actions necessary to detect "Ready to Merge" issues, test for file changes conflicts, and execute the batch merges
. Following that, Phase 7 will focus on adding the "Loops" tab to the dashboard to deploy your developer crons
.
Would you like to start outlining the specific Convex mutations needed for the Merge Queue next?
Let's outline the Convex mutations for the Merge Queue
How would the Merge Queue detect logic-level code conflicts?
Tell me more about the 'Active Loops' dashboard UI
Help me come up with a strategic advantage. What can we do to link all these together and do what they don't?

The ultimate strategic advantage for OpenGrove is to position the platform not just as a tool that tracks work, but as the unified orchestration layer for AI agents.
Right now, the developer ecosystem is deeply fragmented: teams use Linear for planning, local tools like Cursor or Claude Code for execution, Greptile for PR reviews, and GitHub Actions for infrastructure
. Because these tools are disconnected, they create an "unsolved problem" at the deployment level: when multiple coding agents run in parallel, they constantly stumble over each other, creating "commit locks" where agents are forced to constantly rebase and rerun expensive CI pipelines just to merge their code
.
You can link all of your features together to form a seamless, self-healing lifecycle that competitors simply cannot match because they are either only issue trackers or only coding agents.
Here is how you link your pillars together into a strategic advantage:
1. The Issue Tracker Becomes the Agent Runtime (The Trigger) Traditional trackers are passive and require humans to update them
. OpenGrove changes this by turning the tracker into a live runtime environment via Native Loops
. For example, if a production error occurs, it doesn't just sit as a ticket. It triggers an OpenGrove loop (like a "production error sweep") running natively on your Convex infrastructure
.
2. The Centralized Skills Registry (The Context) When that loop kicks off, the agent doesn't rely on fragmented .cursorrules or .agents.md files scattered across local developer machines
. Instead, it queries OpenGrove's Centralized Skills Registry
. OpenGrove feeds the agent the exact organizational guidelines, API schemas, and quality gates it needs to fix the issue
.
3. The Agentic Merge Queue (The Execution & Coordination) This is your massive differentiator. Experts currently have to manually "batch commit" PRs to get around the parallel agent bottleneck
. Because OpenGrove acts as the central git coordinator, it can automatically review all the PRs generated by your agents and human developers
. If PRs are conflict-free, OpenGrove's Agentic Merge Queue batches them into a single integration branch, runs the CI pipeline exactly once, and merges them
. This completely eliminates the commit lock bottleneck and drastically cuts CI build costs
.
4. Semantic Code-Sync (The Closed Loop) Because OpenGrove inherently understands the codebase, its Semantic GitHub linking automatically detects these agent-driven PRs, commits, and merges
. Even if an AI agent or a human forgets to tag an issue number, OpenGrove compares the PR files and descriptions to the active issues, accurately links them, and moves the status to "Done"
.
The Pitch: What OpenGrove does that they don't
Other platforms force developers to write messy custom scripts and webhooks to stitch together planning, coding, and deploying
. OpenGrove is the only platform that orchestrates the entire agentic loop. By natively combining the context of the issue board, the rules of the organization, and the traffic control of a merge queue, OpenGrove allows teams to safely run massive parallel agent operations without breaking their codebase or bankrupting their CI budgets
.
Would you like to start outlining the specific Convex mutations needed for the Merge Queue next?
How can we design the Skills Registry to serve external agents like Cursor or Claude Code?
Could we use the Agentic Merge Queue to reduce CI costs by batching PRs?
This is from the coding agent. How does this sound as an implementation plan? Are there any tweaks that are needed to be made as far as the architecture goes to make this vision out? Are we missing anything? What should we add? # OpenGrove v2: Architecture Gap Analysis & Build Plan



Goal: Transform OpenGrove from a "Linear clone" into the code-aware agent orchestration layer described in our vision docs.




Current State: What We Actually Have Built

✅ Fully Implemented

Feature	Files	Status
Issue Tracker Core	convex/issues.ts, convex/teams.ts	CRUD, statuses, priorities, labels, assignees, sort orders
Kanban Board	components/board/	dnd-kit drag-and-drop, fractional ordering
AI Chat Agent	convex/agent/ (8 files)	Chat UI, streaming, thread management, 9 tools
AI Triage	triage.ts	Duplicate detection (embeddings), priority/label suggestions
Semantic PR Linking	github.ts	Explicit key matching + embedding-based semantic fallback
GitHub Webhook Handler	http.ts	HMAC verification, push + PR events, auto-status transitions
AI Suggestion Inbox	triage-panel.tsx	Accept/reject semantic link suggestions
Rate Limiting	limiter.ts	50 msgs/day on Pro, unlimited Enterprise
Billing/Plans	components/billing/, lib/plans.ts	Free/Pro/Enterprise, Clerk checkout
Integrations Settings	integrations/page.tsx	GitHub repo linking, Slack webhooks, webhook URL copy
Onboarding Wizard	page.tsx	3-step GitHub import flow
Clerk Auth + Webhooks	convex/webhooks.ts	User/org/membership/subscription sync
Command Palette	components/commands/	⌘K, registry pattern, shortcuts

🔶 Partially Implemented
This implementation plan is an excellent translation of our product vision into a concrete engineering roadmap. The coding agent has successfully audited the existing features
 and correctly identified the critical missing pieces: the Skills Registry, Automations, Loops, and the Agent Merge Queue
.
However, there are a few critical architectural tweaks you need to make, specifically regarding the agent's "Open Questions," and one major missing element to add back in.
1. Architectural Tweaks (Answering the Agent's Open Questions)
Do not use the views.filters workaround for the schema. The agent notes that the database schema is frozen and suggests a workaround of storing organizational skills as serialized JSON inside the existing views table
. Because the Skills Registry, Automations, and Loops are the foundation of your new product
, shoehorning them into existing tables will create massive technical debt. Instruct the agent to choose Option 3: a controlled schema migration
 to build dedicated, strongly-typed Convex tables for these features.
Mandate the GitHub App setup over a PAT. The agent asks how to authenticate the server-side GitHub API calls for automated background loops (since there is no active user session at 2 AM for things like the "Overnight Docs Sweep")
. While a Personal Access Token (PAT) stored as an environment variable is easier, it is not scalable or secure for a B2B SaaS platform. Instruct the agent to proceed with Option 1: building a proper GitHub App installation
. This is a necessary architectural foundation for the diff analysis and PR review tools
.
2. What Is Missing?
The External API for the Skills Registry Under Phase 1A (Skills Registry), the agent lists the Convex CRUD functions, the UI page, and the internal agent integration
. However, it completely misses the core vision we discussed earlier: the registry must also serve as a single API endpoint for external local agents (like Cursor or Claude Code).
What to add: Direct the agent to build a public API route (e.g., using Convex HTTP actions) that allows developers to fetch their organization's active skills via an API key, so their local IDEs stay synchronized with the OpenGrove platform.
3. Build Priority Assessment
The agent proposes building Skills, Automations, and Loops first (Phase 1)
, and pushing the Agentic Merge Queue to Phase 2
.
This sequencing actually makes perfect sense from an engineering perspective. The agent needs the GitHub diff analysis tools
 and the underlying automation engine
 built before it can realistically act as a "traffic controller" for complex PR batches
.
My recommendation for your reply to the agent: Approve the phased approach, but give them clear directives on the open questions:
Approve the controlled schema migration for new tables.
Mandate the GitHub App architecture.
Add the requirement for an external API endpoint in the Skills Registry.
Instruct them to start with Skills first
, as it serves as the foundational "Org Brain" that the automations and loops will eventually pull from.
Would you like me to help draft the specific response to the coding agent outlining these technical decisions?
Help me draft the response to the coding agent
How should we design the external API for the Skills Registry?
Let's outline the schema changes for Skills, Automations, and Loops
Start typing...
2 sources
Studio
Report
Architecture Specification: Skills Registry & Automation Engine
Architecture Specification: Skills Registry & Automation Engine
1. Strategic Context and System Evolution
OpenGrove is currently at a critical inflection point. To move beyond being a high-fidelity "Linear clone," we must transition into a code-aware agent orchestration layer. This shift represents a move from a reactive record-keeper—where developers manually input data—to a proactive orchestrator that anticipates needs and executes tasks autonomously. The Skills Registry and Automation Engine serve as the "rocket engine" for this evolution, providing the cognitive infrastructure and execution framework necessary for the platform to become a persistent participant in the development lifecycle.
The following table identifies the current state of implementation and the high-priority gaps that this specification aims to bridge.
Category
Fully Implemented Features
Missing Critical Gaps (Priority)
Core Engine
Issue Tracker, Kanban, AI Triage
Skills Registry ("Org Brain") (🔴 Critical)
Automation
GitHub Webhook Handler, Semantic PR Linking
Automation Engine (Trigger-Prompt-Action) (🔴 Critical)
Autonomy
AI Chat Agent (9 tools), Rate Limiting
Active Loops Dashboard / Agent Merge Queue (🔴 Critical)
Infrastructure
Billing, Clerk Auth, Onboarding Wizard
Analytics Dashboard / Multi-Tool Chaining (🟡 High)
Code Intelligence
Semantic PR Linking
Code Review Loop / Diff Analysis Tools (🟡 High)
This architecture bridges the gap between current CRUD capabilities and autonomous agent loops, ensuring "the system moves while you sleep" by transitioning from human-initiated actions to event-driven, multi-step agent reasoning.
2. Architectural Workarounds for the "Schema Freeze"
The current development environment operates under a frozen schema. Maintaining the high-performance, real-time requirements of the Convex database is non-negotiable; however, the requirement to store structured skill definitions and automation metadata necessitates a strategy for data persistence. We must evaluate three distinct paths to accommodate these new entities.
Storage Option Evaluation
Option
Description
Pros
Cons
1. Serialized JSON in views.filters
Repurpose the existing views table. Store skill metadata as JSON strings within the filters field.
Low latency; utilizes existing by_org indexing; type safety via TS interfaces.
Requires "type prefixing" (e.g., skill_) to distinguish from standard views.
2. Convex File Storage
Store skill definitions and prompt templates as standalone JSON files.
Ideal for massive prompt templates; native versioning support.
Significant latency overhead for file fetching; complex to query across multiple skills.
3. Controlled Schema Migration
Request a specific bypass to add dedicated skills and automations tables.
Proper long-term architecture; cleanest query logic.
Breaks "Freeze" protocol; requires coordination for migration scripts.
Recommended Path
The Recommended Path is Option 1 (Repurposing views.filters) for immediate deployment. By implementing a strict type field check (e.g., where("type", "==", "skill")) in Convex queries, we leverage existing infrastructure with zero migration risk. We will utilize a "type prefix" strategy for the name field to ensure UI components don't accidentally render skills as Kanban views. For the long term, we will move toward Option 3 once the initial "rocket engine" has proven its value.
This storage strategy allows us to immediately house the "Org Brain" metadata required for autonomous discovery.
3. Skills Registry: The "Org Brain" Implementation
The Skills Registry is the centralized repository for reusable prompts and quality gates. Rather than hard-coding instructions into tools, agents query this registry at runtime to discover "how" to perform a task based on organizational standards.
Technical Specification (convex/skills.ts)
The registry will utilize org-scoped queries to ensure cross-tenant security. The implementation must use ctx.db.query().withIndex('by_org') to retrieve available capabilities.
Metadata Schema for Skills:
skillId: Unique identifier (e.g., auto-review-v1).
promptTemplate: The specific instructions passed to the LLM.
qualityGates: An array of logic-based checks (e.g., no-console-logs, has-tests) that the agent must verify.
version: Semantic versioning for prompt iteration.
Pre-built Skills & Loop Integration
To differentiate from standard trackers, we will ship with three core skills that directly power our Phase 1 "Loops":
Auto-review: Analyzes PR diffs against style guides; powers the Code Review Loop.
Triage: Semantic analysis of new issues; powers the Duplicate Radar.
Docs-sweep: Identifies documentation drift; powers the Overnight Docs Sweep.
These skills transform the agent from a chat-bot into a specialized engineer that understands the specific quality bars of the organization.
4. Automation Engine: Trigger-Prompt-Action Framework
The Automation Engine is the execution bridge. It monitors system events and schedules agent activity to resolve the "passive system" problem.
Supported Triggers and Implementation Mapping
Trigger
Source
Convex File
Status
PR Events (Opened/Merged)
GitHub Webhook
convex/github.ts
✅ Wired
Push (Commit) Events
GitHub Webhook
convex/github.ts
✅ Wired
Issue Created
Issue Mutation
convex/issues.ts
❌ Hook Needed
Issue Status Changed
Issue Mutation
convex/issues.ts
❌ Hook Needed
Cron Schedule (Nightly)
Convex Native
convex/crons.ts
✅ Wired
Interaction Logic & runAfter()
To bypass the 10-second timeout limit for Convex HTTP actions, the engine uses a hand-off pattern. When a GitHub webhook hits http.ts, it verifies the HMAC and immediately calls ctx.scheduler.runAfter(0, internal.agent.run, { ... }). This shifts the intensive LLM generation and tool-calling logic into an asynchronous background action, allowing for long-running reasoning chains without blocking the webhook response.
Multi-Tool Chaining
The system utilizes the agent’s stepCountIs(12) capability to perform complex sequences. For example, the Agent Merge Queue loop will:
fetchPRDiff: Retrieve the code changes.
analyzeCodeChanges: Map changes to existing issues.
findSimilarIssues: Check for conflicts in the Duplicate Radar.
updateIssue: Report findings and transition status.
5. System Integrity, Security, and Verification
Allowing autonomous agents to modify codebase state requires rigorous security and validation protocols.
GitHub API Access & Security Failure Modes
Current implementation relies on Clerk OAuth tokens. While sufficient for user-session tasks, these tokens are session-based and will expire, causing "2 AM" cron loops (like the Overnight Docs Sweep) to fail.
Architectural Mandate: We must transition to a GitHub App installation.
Security Implementation: The GitHub App Private Key and App ID must be stored as encrypted Convex Environment Variables. This ensures the agent has persistent, server-to-server access without requiring a logged-in user.
Verification Plan
To ensure system stability and adherence to the 50 msgs/day Pro rate limit, the following checks are mandatory:
[ ] Skill Lifecycle: Verify convex/skills.ts correctly creates and filters by orgId.
[ ] Trigger Reactivity: Open a dummy PR; verify ctx.scheduler.runAfter triggers the agent within 2 seconds.
[ ] Nightly Loop Execution: Verify the Duplicate Radar and Standup Generator execute at the 2 AM/8 AM cron marks via the Convex dashboard logs.
[ ] Safety Constraints: Force an agent into a loop and verify it terminates at the 12-step limit or when hitting the daily rate limit.
[ ] Token Persistence: Ensure the Overnight Docs Sweep completes successfully without an active Clerk session.
This specification provides the technical roadmap to resolve the identified architecture gaps while respecting the schema freeze and leveraging our existing high-performance stack.
