Yes — Linear, Jira, GitHub, and others already have basic auto-linking, but mostly through explicit references:

Linear links PRs/commits when the issue ID appears in the branch name, PR title, PR description, or commit message. It also supports “magic words” with the issue ID.

Jira’s GitHub integration works the same way: to connect GitHub development data to a Jira work item, you need the Jira key in the commit message, branch name, or PR title.

GitHub itself can link or close issues from PR descriptions or commit messages using keywords like “fixes,” “closes,” or “resolves.”

So the basic version is common.

But what you’re proposing is different:

“Even if the developer forgets the issue ID, OpenGrove understands what the work is about and connects it anyway.”

That is not just a convenience feature. That is a traceability recovery feature, and it matters a lot more in the agentic coding era.

There is research around this exact problem: issue-to-commit linking is important for software traceability, but many real links are missing or incorrect; one recent paper cites a GitHub study where only 42.2% of issues were correctly linked to commits. Another recent paper frames issue-commit linking as crucial for software maintenance and shows retrieval/vector approaches can meaningfully improve matching.

Why this is actually valuable

The real problem is not “developers are too lazy to type ENG-12.”

The real problem is that the tracker, GitHub, and the human brain drift apart.

A developer works on something. They push commits. They open a PR. The ticket does not move. The manager asks for status. The developer says, “Oh yeah, that’s basically done.” Then someone manually updates the board. Multiply that by every issue, every repo, every week. That is wasted context-switching.

Semantic auto-linking makes the tracker feel alive.

For beginners, it gives them guardrails. Junior devs forget naming conventions. They write messy commit messages. They do not always know the ritual: create branch from issue, include ticket key, use correct magic words, move status, link PR. Your system can catch the intent and keep the workflow clean without scolding them. It turns “I forgot the process” into “the system quietly cleaned it up.”

For senior engineers, the value is different. Seniors hate admin drag. They jump across repos, fix related bugs, review PRs, unblock people, and ship under ambiguity. Semantic linking saves them from paperwork and creates a better audit trail without forcing them to babysit the tracker. The win is not that it writes code faster. The win is that it removes the tax around the code.

For teams, this becomes status automation. Product sees what is moving. Engineering sees stale issues. The AI agent knows what work maps to what objective. Releases become easier because PRs, issues, projects, cycles, and repos are tied together.

That is the 10x angle: not “one developer codes 10x faster,” but the team loses less operational energy keeping reality synced.

Where OpenGrove can be better than Linear/Jira

Do not try to beat Linear by being “Linear but semantic.” That is a knife fight in a phone booth.

Beat them by being agent-native from the start.

Linear is built for high-speed human teams with AI layered in. OpenGrove can be built for humans and coding agents sharing the same workspace.

Your current UI already points in that direction. The dark Linear-like interface, Command-K, teams, cycles, projects, GitHub integration, and AI Agent nav item are the right bones. The move now is to make the app feel less like a passive tracker and more like a mission control layer.

What I would add to the UI

1. Add a repo switcher beside team/project context

Right now you have:

Engineering · Board

Eventually that should become something like:

Engineering · OpenGrove Web · Board

Or:

Engineering / open-grove / Board

Because in the agentic IDE world, people think in workspaces and repos. Cursor, Windsurf, Claude Code, etc. are moving people toward “all my projects are available and the agent knows the map.”

So OpenGrove should have this hierarchy:

Organization
→ Workspace
→ Team
→ Project
→ Repositories
→ Issues / PRs / Commits / Agents

But in the UI, do not make it feel that heavy. Make it feel like a fast context switcher.

Command-K should let me type:

repo open-grove
project mobile app
cycle current
issue search bar
agent summarize repo

That is where your Command-K becomes a weapon.

2. Add a “Connected Repos” panel per organization

Yes, each organization should be able to connect its own repos.

The model should be:

Organization owns GitHub installation
Teams can map to one or more repos
Projects can map to one or more repos
Issues can optionally map to repo(s)

Do not make repo connection only global. That will break as soon as someone has:

Frontend repo
Backend repo
Docs repo
Mobile repo
Infra repo
AI agent repo

A single organization can absolutely have multiple projects with multiple repos. That is normal.

The important thing is mapping:

WVFM Labs organization
Engineering team
open-grove repo
open-grove-api repo
docs repo
Marketing team
website repo
landing-pages repo

Then semantic matching should use the repo as a strong filter.

3. Add “Repo Intelligence” to the AI Agent section

Your sidebar already has AI Agent. Good. Make that page useful early.

Give it cards like:

Repository Activity

- 3 PRs opened this week
- 2 issues likely completed but not closed
- 4 commits have no linked issue
- 1 stale PR blocking current cycle
  Suggested Links
- PR #42 probably relates to ENG-12 — 91%
- Commit abc123 probably relates to ENG-9 — 87%

This is where you avoid overly aggressive automation. The AI can either auto-link above a high threshold or suggest links when confidence is medium.

Something like:

> = 0.88: auto-link
> 0.78–0.87: suggest
> < 0.78: ignore

Your earlier 0.82 threshold is okay for MVP, but for user trust, I’d split it into auto versus suggested.

4. Add “Why did this link?” affordance

Every AI-linked issue comment should have a small disclosure:

Why this matched

Clicking it shows:

Matched against:

- Issue title
- Issue description
- Related labels
- Similar files touched
- PR title/body
  Confidence: 94%

This makes the feature feel trustworthy instead of spooky.

If AI moves people’s work around and gives no reason, people will hate it. If it explains itself, they will forgive occasional misses.

5. Add a review inbox for AI actions

You already have an Inbox nav item. Perfect.

Use it.

Create an AI Suggestions section inside Inbox:

AI Suggestions

- Link PR #18 to ENG-7?
- Move ENG-14 to In Review?
- Create issue from failing build?
- This commit appears unrelated to any active issue

Beginners get help. Seniors get a fast approval queue. Managers get visibility.

That is much better than silently doing everything.

How this helps beginners

For beginners, OpenGrove can become a workflow coach:

“You opened a PR without linking an issue. I found a likely match.”
“This issue has a PR open. Want to move it to In Progress?”
“This PR merged. Should I mark the issue Done or In Review?”
“Your commit message is vague. Suggested better message: feat(repo): add fuzzy search to selector”

That is not just tracking. That is training.

A beginner learns professional workflow without needing a senior engineer to constantly correct process details. Less hand-holding, fewer Slack pings, cleaner team history.

How this helps senior engineers

For seniors, the value is speed and context recovery:

“What changed across all repos since yesterday?”
“Which issues are actually in progress based on GitHub activity?”
“Show me PRs connected to the current cycle.”
“Which commits shipped but were never linked to product work?”
“Summarize risk before release.”

Senior engineers do not need another board. They need a system that maintains the board while they move.

How this helps agentic development

This is the bigger future-facing piece.

Agentic IDEs are changing the workflow from:

Human writes every line → commits → updates ticket

to:

Human defines intent → agent changes files → human reviews → system tracks work

That means OpenGrove should become the context layer between:

Issues
Projects
Repos
PRs
Commits
Agents
Cycles
Releases

So when an agent works, it should be able to say:

I am working on ENG-12.
I touched these files.
I opened this PR.
This likely affects these issues.
This is ready for review.

Your semantic linking feature is the first brick in that wall.

Multiple repos and projects: how I’d structure it

I would use this model:

organizations
teams
projects
repos
projectRepos
teamRepos
issues
issueRepos
githubEvents
semanticLinks
agentSessions

A repo can belong to an organization.

A team can connect to multiple repos.

A project can connect to multiple repos.

An issue can optionally be scoped to a repo, but should not have to be. Some issues are product-level, not repo-level.

Example:

Project: Onboarding V2
Repos:

- open-grove-web
- open-grove-convex
- open-grove-docs
  Issue: Add GitHub repo picker
  Likely repo:
- open-grove-web
  Issue: Create semantic webhook processor
  Likely repo:
- open-grove-convex

This avoids the trap where every issue must belong to exactly one repo. Real software is messier than that. Sadly, software did not consult our database schema first.

What should be in Command-K

Your Command-K should become the center of the product.

Add commands like:

Connect GitHub repository
Switch repository
Search repositories
Create issue from current repo
Show unlinked commits
Show AI suggestions
Show current cycle health
Ask AI about this repo
Generate issues from GitHub activity
Summarize PRs this week
Find stale issues

Then add natural language:

“what shipped yesterday”
“show unlinked prs”
“connect repo”
“move all merged PR issues to review”
“create issues from latest TODOs”

The command menu should not just navigate. It should operate.

That is where you can feel better than Linear. Linear’s command menu is fast. Yours can be fast and agentic.

My recommendation for the semantic-linking feature

Build it, but make it trust-preserving.

MVP behavior:

Explicit issue key found:
link automatically
Semantic match >= 0.88 and clear winner:
auto-link + comment
Semantic match 0.78–0.87:
create AI suggestion in Inbox
Semantic match below 0.78:
log silently

And for status changes:

PR opened:
suggest or move to In Progress
PR ready for review:
move to In Review
PR merged:
move to Done only if org setting allows it

Default merge behavior should probably be:

Move to In Review

Not Done.

Because merged does not always mean shipped, QA’d, or accepted.

The feature pitch

The clean pitch is:

OpenGrove keeps your tracker synced with the actual work happening in your repos — even when humans or agents forget to update tickets.

That is good.

Even sharper:

Your board updates itself from the codebase.

That is the product. That is the wedge.

What I would build next after semantic linking

After you implement the backend, I’d build these UI pieces in this order:

1. Organization GitHub connection settings
2. Repo mapping to teams/projects
3. AI Suggestions inbox
4. Issue activity cards showing PRs/commits
5. Command-K repo/project/AI actions
6. AI Agent page with repo intelligence
7. Cycle health from GitHub activity

That creates a product loop:

Create issue → code happens → OpenGrove detects it → board updates → AI summarizes momentum → team ships cleaner

So yes, the semantic linking feature is worth building. But don’t frame it as “we auto-link PRs.”

Frame it as the first piece of self-maintaining project management for human + AI engineering teams.

Absolutely. Drop this into docs/specs/phase-5-semetic.md. I’d also fix the filename typo later from semetic to semantic, but don’t let spelling block shipping — that’s how repos become haunted.

Phase 5: Semantic GitHub Linking, Repo Intelligence, and Agentic Workflow Layer

Overview

Phase 5 upgrades OpenGrove from a fast issue tracker into a code-aware project workspace.

The core goal is simple:

OpenGrove keeps the board synced with the codebase.

Today, most issue trackers depend on developers manually adding issue keys like ENG-142 to branch names, commit messages, and pull request titles. That works when everyone follows the ritual. It breaks when people forget, move fast, or use AI coding agents that generate changes across multiple files and repositories.

This phase introduces semantic GitHub linking, repo-to-team/project mapping, AI suggestions, and repo-aware agent workflows. OpenGrove should understand the relationship between issues, pull requests, commits, projects, cycles, and repositories — even when the connection is not explicitly typed by a human.

This is the foundation for a self-maintaining tracker for human and AI engineering teams.

⸻

Product Positioning

OpenGrove should not just be “a Linear clone with AI.”

The differentiator is:

Issues are planned work. GitHub is actual work. OpenGrove keeps them connected.

The product story should become:

Plan work, ship code, and let OpenGrove keep the board in sync — with keyboard-first issues, live cycles, semantic GitHub linking, and an AI agent that handles the busywork.

This phase should make OpenGrove feel like the operating layer between:

- Issues
- Pull requests
- Commits
- Repositories
- Projects
- Cycles
- AI coding agents
- Team activity

⸻

Primary User Value

For beginner developers

Beginner developers often forget workflow conventions:

- They do not include issue IDs in branch names.
- They write vague commit messages.
- They forget to move issues across statuses.
- They do not always know when a PR should be connected to a ticket.

OpenGrove should quietly help them by detecting likely connections and keeping the project history clean.

Example:

“You opened a PR without linking an issue. OpenGrove found a likely match and suggested it.”

This turns OpenGrove into a workflow coach without nagging the user.

For senior engineers

Senior engineers jump across multiple tasks, repos, reviews, and fixes. Their pain is not knowing how to use a tracker. Their pain is keeping the tracker updated while real work moves quickly.

OpenGrove should reduce project-management tax by:

- Linking PRs and commits to issues automatically.
- Surfacing unlinked work.
- Summarizing what changed across repos.
- Showing cycle risk based on real engineering activity.
- Creating follow-up issues from TODOs, blockers, and review notes.

The win is not that a senior engineer writes code 10x faster. The win is that the team loses less time keeping reality synced.

For AI-assisted teams

Agentic IDEs and coding agents are changing the workflow from:

Human writes every line → commits → updates ticket

to:

Human defines intent → agent changes files → human reviews → system tracks work

OpenGrove should become the context layer for that workflow.

The tracker should understand:

- What issue the agent is working on
- Which files changed
- Which PR was opened
- Which issue should move status
- Which work shipped
- Which work is untracked

⸻

Phase 5 Feature Set

This phase includes the following major additions:

1. Semantic GitHub linking
2. Explicit issue key linking
3. Commit-to-issue matching
4. PR-to-issue matching
5. Confidence scoring
6. AI Suggestions Inbox
7. Repo-to-organization mapping
8. Repo-to-team mapping
9. Repo-to-project mapping
10. Multi-repo organizations
11. GitHub activity timeline on issues
12. Smart status movement from PR events
13. Org-level automation settings
14. Agent summaries from GitHub and issue activity
15. Unlinked PR/commit detection
16. Duplicate issue detection
17. Command-K repo switching
18. Command-K GitHub actions
19. Command-K AI actions
20. Cycle health from real GitHub activity
21. Release and shipped-work summaries

⸻

Part 1: Semantic GitHub Linking

Goal

Allow developers to push commits or open pull requests without typing strict issue identifiers like ENG-142.

When a GitHub event arrives, OpenGrove should first attempt explicit issue-key matching. If no issue key is found, the system should fall back to semantic matching using embeddings and vector search.

The system should be able to infer that a PR like:

feat: add fuzzy repo selector to onboarding

likely maps to an issue like:

ENG-147 · Add searchable repository picker

even if the PR title does not include ENG-147.

⸻

Existing Baseline

Traditional trackers support explicit linking:

- Branch name includes issue key
- PR title includes issue key
- PR description includes issue key
- Commit message includes issue key

OpenGrove should continue supporting this because explicit linking is the most reliable path.

Semantic matching is a fallback layer, not a replacement.

⸻

Event Flow

Mutation: handleGithubEvent

When a GitHub webhook arrives:

1. Parse the webhook event.
2. Extract relevant text from the event.
3. Attempt explicit issue key extraction, such as ENG-142.
4. If explicit keys are found:
   - Link the PR/commit to the issue.
   - Update status based on the event.
   - Add issue activity.
5. If no explicit keys are found:
   - Look up connected repositories by GitHub repo full name.
   - Find organizations, teams, and projects connected to that repo.
   - Schedule semantic processing using an internal background action.

Important Convex constraint:

Vector search and external embedding calls should happen in an async action, not directly inside the webhook mutation.

The mutation should schedule the semantic action immediately using ctx.scheduler.runAfter(0, ...).

⸻

Internal Action: handleSemanticGithubEvent

This should be an internal Convex action.

The action receives:

{
organizationId,
repoId,
repoName,
repoFullName,
githubEventId,
eventType,
semanticText,
prNumber?,
prUrl?,
prTitle?,
prBody?,
commitSha?,
commitUrl?,
branchName?,
changedFiles?,
}

The action should:

1. Load the organization.
2. Confirm AI features are enabled.
3. Confirm OPENAI_API_KEY exists.
4. Confirm the organization is eligible for AI features.
   - Allowed plans: pro, enterprise
5. Generate an embedding for the incoming semantic text.
6. Query the issues.by_embedding vector index.
7. Filter search by organizationId.
8. Optionally filter or boost by connected team/project/repo.
9. Evaluate the top match and second-best match.
10. If confidence is high, call an internal mutation to link the event.
11. If confidence is medium, create an AI suggestion.
12. If confidence is low, log silently and do nothing user-visible.

⸻

Internal Mutation: linkSemanticIssueEvent

This should also be an internal mutation.

Responsibilities:

1. Check idempotency.
2. Create a semantic link record.
3. Attach PR/commit metadata to the issue.
4. Add a rich issue comment.
5. Add issue activity.
6. Move the issue status if appropriate.
7. Store confidence and link source.

Example comment:

🤖 **AI Semantic Link**
Automatically associated this pull request with this issue based on topic similarity.
**Confidence:** 94%  
**Source:** PR title, description, commits, and changed files

⸻

Confidence Rules

Use a tiered trust system instead of one hard threshold.

Recommended MVP thresholds:

const AUTO_LINK_THRESHOLD = 0.88;
const SUGGESTION_THRESHOLD = 0.78;
const MIN_SCORE_GAP = 0.04;

Rules:

Top score >= 0.88 and top score beats second-best score by >= 0.04:
Auto-link
Top score >= 0.78:
Create AI suggestion in Inbox
Below 0.78:
Log silently

Reasoning:

- High-confidence matches should save time automatically.
- Medium-confidence matches should ask for approval.
- Low-confidence matches should not create noise.

Avoid making the AI feel reckless.

⸻

Ambiguity Protection

Semantic matching should not auto-link when two issues are nearly tied.

Example:

ENG-147 score: 0.841
ENG-139 score: 0.837

This is ambiguous. The system should create a suggestion or silently log instead of auto-linking.

Required check:

topScore - secondBestScore >= MIN_SCORE_GAP

⸻

Idempotency

GitHub webhooks retry. Commits can be pushed again. PRs can be reopened. The same event may arrive more than once.

Add idempotency protection.

Potential table:

githubSemanticLinks: {
organizationId,
issueId,
repoId,
repoName,
repoFullName,
eventType,
githubEventId,
prNumber?,
commitSha?,
confidence,
linkSource,
createdAt,
}

Before creating a new comment or activity item, check for an existing record by:

organizationId + githubEventId + issueId

For commits, also dedupe by:

organizationId + commitSha + issueId

This prevents duplicate comments and repeated status changes.

⸻

Link Source Metadata

Every linked event should store the source of the association.

Possible values:

type LinkSource =
| "explicit_key"
| "semantic_ai"
| "manual"
| "ai_suggestion_approved";

Store:

{
linkSource,
confidence?,
matchedText?,
matchedFields?,
}

This allows the UI to explain why the issue was linked.

⸻

Vector Index Requirements

The issues table should have an embedding field.

The vector index must be scoped by organization.

Example schema direction:

.vectorIndex("by_embedding", {
vectorField: "embedding",
dimensions: 1536,
filterFields: ["organizationId"],
})

Semantic search must filter by organization:

filter: (q) => q.eq("organizationId", organizationId)

Do not allow cross-organization semantic matching.

That would destroy trust.

⸻

Issue Embedding Creation

Semantic matching only works if issues have embeddings.

When an issue is created or materially updated, generate an embedding from:

Issue title
Issue description
Labels
Project name
Team name
Acceptance criteria
Related links

Recommended helper:

buildIssueEmbeddingText(issue, team, project, labels)

Example output:

Title: Add searchable repository picker
Description: Users should be able to search and filter repositories during GitHub onboarding.
Team: Engineering
Project: GitHub Integration
Labels: onboarding, github, repository, search

⸻

Existing Issue Backfill

Add a backfill action for existing issues.

Potential action:

internal.issues.backfillIssueEmbeddings

Responsibilities:

1. Find issues missing embeddings.
2. Generate embeddings in batches.
3. Store embeddings.
4. Avoid rate-limit problems.
5. Log progress.

Without this, semantic matching will only work on newly created issues.

⸻

Semantic Text Creation

Do not embed only the PR title or only the commit message.

Build rich semantic text.

For pull requests:

PR title
PR body
Branch name
Commit titles
Changed file paths
Repository name

For commits:

Commit message
Changed file paths
Branch name
Repository name

File paths are highly useful. A vague commit like:

fix broken state

becomes more meaningful when paired with:

components/repo-selector.tsx
convex/github.ts

Recommended helper:

buildGithubSemanticText(event)

⸻

Part 2: Smart Status Movement

Goal

Use GitHub activity to update issue status without requiring manual board maintenance.

Suggested Default Behavior

PR opened:
Move linked issue to In Progress
PR reopened:
Move linked issue to In Progress
PR marked ready for review:
Move linked issue to In Review
PR converted to draft:
Keep status or move to In Progress
PR merged:
Move linked issue based on organization setting
PR closed without merge:
Do not mark Done

Merge Behavior Setting

Do not hardcode PR merge to Done for every team.

Some teams treat merge as done. Others still require QA, staging, deployment, or client approval.

Add org-level setting:

githubMergeBehavior:
| "mark_done"
| "mark_in_review"
| "no_status_change"

Recommended default:

mark_in_review

This is safer than marking work done too early.

⸻

Part 3: AI Suggestions Inbox

Goal

Give users a safe review layer for uncertain AI actions.

Not every semantic match should mutate the board.

Medium-confidence matches should create suggestions in the Inbox.

Suggested Table

aiSuggestions: {
organizationId,
teamId?,
projectId?,
repoId?,
issueId?,
type:
| "link_pr_to_issue"
| "link_commit_to_issue"
| "move_issue_status"
| "possible_duplicate"
| "create_followup_issue"
| "unlinked_work_detected",
title,
body,
confidence?,
payload,
status: "pending" | "approved" | "ignored" | "expired",
createdAt,
resolvedAt?,
resolvedBy?,
}

Example Suggestions

Link PR #218 to ENG-147?
Confidence: 84%
Reason: Similar title, changed files, and issue description.
Move ENG-142 to In Review?
Reason: Linked PR was marked ready for review.
Possible duplicate detected
ENG-151 looks similar to ENG-147.
Unlinked work detected
Commit a81f3c touched repo selector files but has no linked issue.

Actions

Each suggestion should support:

- Approve
- Ignore
- View details
- Open related PR/commit
- Open issue

Approved suggestions should write an activity entry.

⸻

Part 4: Repository Mapping

Goal

Allow organizations to connect multiple GitHub repositories and map them to teams and projects.

Modern software teams often have:

- Frontend repo
- Backend repo
- Mobile repo
- Docs repo
- Infrastructure repo
- Design system repo
- AI agent repo

OpenGrove must support this without making the UI heavy.

Recommended Data Model

organizations
teams
projects
repos
teamRepos
projectRepos
issueRepos
githubEvents
githubSemanticLinks
aiSuggestions
agentSessions

Repository Ownership

A repository should belong to an organization.

A team can map to one or more repositories.

A project can map to one or more repositories.

An issue can optionally map to one or more repositories.

Do not force every issue to belong to exactly one repo. Some issues are product-level or cross-repo.

Example:

Organization: WVFM Labs
Team: Engineering
Repos:

- open-grove-web
- open-grove-convex
- open-grove-docs
  Project: GitHub Integration
  Repos:
- open-grove-web
- open-grove-convex
  Issue: Add searchable repository picker
  Likely repo:
- open-grove-web
  Issue: Create semantic webhook processor
  Likely repo:
- open-grove-convex

⸻

Part 5: GitHub Activity Timeline

Goal

Each issue should show the full history of related work.

The issue timeline should include:

- Comments
- Status changes
- Assignment changes
- PR links
- Commit links
- AI semantic link events
- AI suggestion approvals
- Agent-created follow-up issues

Example Timeline Entries

Ada moved this issue from Todo to In Progress · 2h ago
GitHub PR #218 linked automatically · 1h ago
AI Semantic Link associated PR #218 with 94% confidence · 1h ago
PR #218 marked ready for review · 35m ago
OpenGrove moved issue to In Review · 35m ago

UI Detail

AI-linked events should include a small “Why this matched” affordance.

Clicking it should show:

Matched against:

- Issue title
- Issue description
- PR title
- PR body
- Commit messages
- Changed files
  Confidence: 94%

This makes the AI feel trustworthy instead of mysterious.

⸻

Part 6: Command-K as Command Center

Goal

Build on the existing Command-K system and make it the control layer for the workspace.

Command-K should not only navigate. It should operate.

Commands to Add

Connect GitHub repository
Switch repository
Search repositories
Show unlinked PRs
Show unlinked commits
Show AI suggestions
Ask agent about this repo
Summarize current cycle
Summarize what shipped yesterday
Create issue from PR
Create issue from commit
Approve suggested link
Ignore suggested link
Move merged PR issues to review
Open GitHub integration settings

Natural Language Examples

The command palette should eventually support phrases like:

what shipped yesterday
show unlinked prs
connect repo
switch to open-grove-web
move all merged PR issues to review
create issues from latest TODOs
ask agent what is blocking cycle 14

Product Direction

Command-K should feel like the workspace operating system.

Users should be able to jump between:

- Organizations
- Teams
- Projects
- Repos
- Issues
- Cycles
- AI suggestions
- Agent actions

without sidebar hunting.

⸻

Part 7: AI Agent Repo Intelligence

Goal

Upgrade the AI Agent from issue-aware to repo-aware.

The agent should understand:

- Issues
- Projects
- Cycles
- GitHub repositories
- Pull requests
- Commits
- Linked/unlinked work
- AI suggestions

Agent Capabilities

Repo-aware answers

User asks:

What changed in open-grove this week?

Agent answers from:

- Linked issues
- PRs
- Commits
- Cycle data
- Status changes

Cycle summaries

User asks:

What shipped in Cycle 14, and what is at risk before Friday?

Agent summarizes:

- Completed issues
- Merged PRs
- In-progress work
- Blocked issues
- Unreviewed PRs
- Unlinked commits

Unlinked work detection

Agent can surface:

3 PRs opened this week have no linked issue.
2 commits touched onboarding files but are not attached to a ticket.
1 merged PR may complete ENG-147.

Follow-up issue creation

Agent can create issues from:

- PR comments
- TODOs
- Review notes
- Blockers
- Failed builds
- Unlinked work

⸻

Part 8: Homepage Copy Updates

The homepage should evolve from:

The issue tracker built for speed

to:

The issue tracker built for speed
Plan work, ship code, and let OpenGrove keep the board in sync — with keyboard-first issues, live cycles, semantic GitHub linking, and an AI agent that handles the busywork.

New Hero Badge Options

New
Your board now understands your repos
New
Semantic GitHub linking is here
New
PRs, commits, and issues stay in sync

Recommended:

New
Your board now understands your repos

New Section: GitHub Sync

Add this after Board & Cycles.

Label

03 · GitHub Sync

Heading

Work links itself

Body

OpenGrove connects issues to pull requests and commits automatically. Use issue keys when you want. When someone forgets, semantic matching catches the work and keeps the tracker honest.

Feature Cards

Explicit when you have it
Branches, PRs, and commits with ENG-142 link instantly.
Semantic when you forget it
No issue key? OpenGrove compares the PR title, description, commits, and files changed against active issues.
Status without babysitting
PR opened, ready for review, or merged — OpenGrove moves the issue according to your team’s workflow.
Suggestions when unsure
Low-confidence matches go to Inbox for approval instead of making a mess.

Mock UI Copy

PR #218 opened
feat: add fuzzy repo selector to onboarding
Matched to
ENG-147 · Add searchable repository picker
Confidence
94%
Done
Linked PR
Moved issue to In Progress
Posted activity comment

Secondary suggestion card:

Needs review
Commit a81f3c
"fix broken state"
Possible match
ENG-139 · Fix websocket reconnect after laptop resume
82% confidence
Approve link
Ignore

⸻

Updated AI Agent Section Copy

Label

04 · AI Agent

Heading

An agent that understands the work

Body

OpenGrove’s agent reads your issues, cycles, projects, and GitHub activity with org-scoped permissions — so it can summarize what shipped, spot risk, create follow-up issues, and keep the team moving.

Feature Cards

Ask about the repo
“What changed in open-grove this week?” gets answered from PRs, commits, and linked issues.
Cycle reports on demand
Generate standups and cycle summaries from real activity, not scattered Slack memory.
Find work that slipped
The agent surfaces PRs and commits that were never connected to an issue.
Create next actions
Turn blockers, TODOs, and review notes into issues without leaving the flow.

⸻

Updated Command Section Copy

Label

05 · Command Center

Heading

One shortcut for everything

Body

OpenGrove’s command bar is more than navigation. Create issues, switch repos, approve AI suggestions, ask the agent, and move work across the system from one place.

Command Examples

Create issue
Connect GitHub repo
Show unlinked PRs
Switch repository
Ask agent about this cycle
Create issue from PR
Approve suggested link
Summarize what shipped

⸻

Updated CTA

Heading

Stop syncing your tracker by hand. Start shipping.

Body

Connect your repos, create your first team, and let OpenGrove keep issues, PRs, commits, cycles, and agent activity in one fast workspace.

Buttons

Get started free
Connect GitHub

⸻

Part 9: Implementation Roadmap

Phase 5A: Backend Foundation

- Add repository tables and mappings.
- Add GitHub event storage.
- Add issue embedding field.
- Add issue vector index with organization filter.
- Add issue embedding generation on create/update.
- Add backfill action for existing issues.

Phase 5B: Semantic GitHub Event Processing

- Modify webhook mutation to extract explicit issue keys.
- Schedule semantic action when no explicit issue key exists.
- Implement semantic text builder.
- Implement embedding helper.
- Implement vector search.
- Implement confidence thresholds.
- Implement idempotent semantic link mutation.
- Implement AI suggestion creation for medium-confidence matches.

Phase 5C: UI Integration

- Add connected repo settings.
- Add repo mapping to teams/projects.
- Add issue timeline GitHub activity cards.
- Add AI Suggestions Inbox.
- Add “Why this matched” UI.
- Add repo switcher.
- Add Command-K GitHub and AI actions.

Phase 5D: Agent Intelligence

- Add tools for repo activity.
- Add tools for unlinked PR/commit detection.
- Add cycle summary from GitHub activity.
- Add follow-up issue generation.
- Add repo-aware agent prompts.

Phase 5E: Homepage Update

- Update hero subcopy.
- Add GitHub Sync section.
- Update AI Agent section.
- Expand Keyboard-first section into Command Center.
- Update CTA.
- Add repo-aware product mock data.

⸻

Part 10: Technical Verification

Automated Checks

Run:

PATH=$PATH:/opt/homebrew/bin:/usr/local/bin npx tsc --noEmit

Run:

PATH=$PATH:/opt/homebrew/bin:/usr/local/bin npm run lint

Manual Verification

1. Create an issue:

ENG-147 · Add searchable repository picker

2. Open a PR without issue key:

feat: add fuzzy repo selector to onboarding

3. Confirm semantic GitHub event action runs.
4. Confirm issue is matched with high confidence.
5. Confirm issue timeline gets an AI semantic link comment.
6. Confirm issue moves to In Progress.
7. Open another vague commit:

fix broken state

8. Confirm if confidence is medium, it creates an AI suggestion instead of auto-linking.
9. Approve suggestion.
10. Confirm activity log records approval and link.

⸻

Success Criteria

This phase is successful when:

- Developers can forget issue keys and OpenGrove still finds the right issue.
- High-confidence PRs link automatically.
- Medium-confidence matches appear as suggestions.
- Low-confidence matches stay silent.
- Issues show related PRs and commits in their timeline.
- Repo mappings work across organizations, teams, and projects.
- Command-K can operate across repos, issues, agent actions, and suggestions.
- The AI Agent can answer what changed in a repo or cycle using real GitHub activity.
- The homepage clearly communicates that OpenGrove keeps the board synced with the codebase.

⸻

Core Product Mantra

Issues are planned work.
GitHub is actual work.
OpenGrove keeps them connected.

Or shorter:

OpenGrove keeps your board synced with the codebase.
