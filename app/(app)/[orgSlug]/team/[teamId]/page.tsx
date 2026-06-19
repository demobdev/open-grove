"use client";

import { useQuery } from "convex/react";
import { Columns3, List, Loader2, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommands } from "@/components/commands/command-provider";
import { IssueRow } from "@/components/issues/issue-row";
import { STATUSES } from "@/components/shared/issue-meta";
import { StatusIcon } from "@/components/shared/status-icon";

/**
 * Team issues list — the foundation vertical slice. Track A adds the board
 * view, filtering, and saved views on top of this route's sibling pages.
 */
export default function TeamIssuesPage() {
  const params = useParams<{ orgSlug: string; teamId: string }>();
  const router = useRouter();
  const teamId = params.teamId as Id<"teams">;
  const team = useQuery(api.teams.get, { teamId });
  const issues = useQuery(api.issues.listByTeam, { teamId });
  const { openCreateIssue } = useCommands();

  if (team === undefined || issues === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (team === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Team not found.
      </div>
    );
  }

  const grouped = STATUSES.map((status) => ({
    status,
    issues: issues
      .filter((issue) => issue.status === status.value)
      .sort((a, b) => b.sortOrder - a.sortOrder),
  })).filter((group) => group.issues.length > 0);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{team.name}</span>
          <span className="text-muted-foreground">Issues</span>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value="list"
            onValueChange={(value) => {
              if (value === "board") {
                router.push(`/${params.orgSlug}/team/${teamId}/board`);
              }
            }}
          >
            <TabsList className="h-7">
              <TabsTrigger value="board" className="h-6 gap-1 px-2 text-xs">
                <Columns3 className="size-3.5" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="h-6 gap-1 px-2 text-xs">
                <List className="size-3.5" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" onClick={openCreateIssue}>
            <Plus className="size-4" />
            New issue
          </Button>
        </div>
      </header>
      <ScrollArea className="flex-1">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <List className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Welcome to OpenGrove</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Your orchestration layer is ready. Follow these steps to set up your automated workspace.
                </p>
              </div>
              
              <div className="rounded-xl border bg-card shadow-sm">
                <div className="flex items-start gap-4 border-b p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-medium text-primary">1</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">Create your first issue</h4>
                    <p className="text-xs text-muted-foreground">
                      Press <kbd className="pointer-events-none mx-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd> anywhere to open the command palette, or press <kbd className="pointer-events-none mx-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">C</kbd>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 border-b p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-medium text-primary">2</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">Connect GitHub</h4>
                    <p className="text-xs text-muted-foreground">
                      Link your repositories in <a href={`/${params.orgSlug}/settings/integrations`} className="font-medium text-primary hover:underline">Integrations</a> so issues automatically transition when PRs open.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-medium text-primary">3</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">Define an AI Skill</h4>
                    <p className="text-xs text-muted-foreground">
                      Visit the <a href={`/${params.orgSlug}/skills`} className="font-medium text-primary hover:underline">Skills Registry</a> to teach your agents about your codebase rules.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button onClick={openCreateIssue} className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Issue
                </Button>
              </div>
            </div>
          </div>
        ) : (
          grouped.map(({ status, issues: groupIssues }) => (
            <section key={status.value}>
              <div className="flex h-9 items-center gap-2 bg-muted/50 px-4 text-sm">
                <StatusIcon status={status.value} />
                <span className="font-medium">{status.label}</span>
                <span className="text-xs text-muted-foreground">
                  {groupIssues.length}
                </span>
              </div>
              {groupIssues.map((issue) => (
                <IssueRow key={issue._id} issue={issue} teamKey={team.key} />
              ))}
            </section>
          ))
        )}
      </ScrollArea>
    </>
  );
}
