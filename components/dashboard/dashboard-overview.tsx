"use client";

import { useParams } from "next/navigation";
import { 
  Zap, 
  Brain, 
  GitPullRequestDraft, 
  Activity, 
  MessageSquarePlus,
  Workflow,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function formatRelativeTime(ms: number) {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const mockStats = {
  activeLoopsCount: 0,
  totalSkillsCount: 12,
  pendingBatchesCount: 1,
  totalRunsCount: 42,
  recentActivity: [
    { id: "1", status: "completed", startedAt: Date.now() - 300000, completedAt: Date.now() - 250000 },
    { id: "2", status: "completed", startedAt: Date.now() - 3600000, completedAt: Date.now() - 3550000 },
    { id: "3", status: "failed", startedAt: Date.now() - 7200000, completedAt: Date.now() - 7190000 },
  ],
  myIssues: [
    { _id: "1", title: "Review agent loop integrations", number: 12, teamId: "t1", teamKey: "ENG", status: "in_progress" },
    { _id: "2", title: "Design new landing page", number: 18, teamId: "t2", teamKey: "DES", status: "todo" },
  ],
};

export function DashboardOverview() {
  const params = useParams<{ orgSlug: string }>();
  // Temporarily mock the stats so the dashboard loads without needing a backend deployment
  // Once merged to main, this can be swapped back to: const stats = useQuery(api.agent.data.getDashboardStats);
  const stats = mockStats;

  if (stats === undefined) {
    return (
      <div className="flex-1 p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl mt-8" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="container mx-auto max-w-6xl px-6 md:px-12 py-8 lg:py-12 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="size-8 text-primary" />
            Workspace Health
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Monitor your agent automations, custom skills, and daily operations.
          </p>
        </div>

        {/* Hero Customization Launchpad */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-8">
          {/* Subtle glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Supercharge Your Workspace
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You have full control over how your workspace operates. Use our agentic chat to build custom <strong>Skills</strong> (tools your agent can use) and <strong>Loops</strong> (background automations) entirely through conversation. No coding required.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button asChild className="gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                  <Link href={`/${params.orgSlug}/ai`}>
                    <Zap className="size-4" />
                    Create an Automation
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 font-medium hover:bg-muted/50 transition-all hover:scale-[1.02]">
                  <Link href={`/${params.orgSlug}/ai`}>
                    <Brain className="size-4 text-emerald-500" />
                    Teach a New Skill
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="hidden md:flex flex-shrink-0 relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
              <div className="h-32 w-32 rounded-full border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center relative z-10 animate-pulse duration-3000">
                <MessageSquarePlus className="size-12 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Health Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 backdrop-blur border-border/50 transition-all hover:bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Loops</CardTitle>
              <Workflow className="size-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activeLoopsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Background agents running</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 transition-all hover:bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Custom Skills</CardTitle>
              <Brain className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalSkillsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Learned workspace tools</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 transition-all hover:bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
              <GitPullRequestDraft className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.pendingBatchesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Merge Queue PRs waiting</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 transition-all hover:bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invocations</CardTitle>
              <Activity className="size-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalRunsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Recent loop executions</p>
            </CardContent>
          </Card>
        </div>

        {/* 2-Column Split: My Work & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* My Work */}
          <Card className="flex flex-col border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                My Assigned Issues
              </CardTitle>
              <CardDescription>Issues currently assigned to you across all teams.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {stats.myIssues.length === 0 ? (
                <div className="h-32 flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  You have no assigned issues.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.myIssues.map((issue) => (
                    <Link 
                      key={issue._id} 
                      href={`/${params.orgSlug}/team/${issue.teamId}/issue/${issue.number}`}
                      className="group flex flex-col gap-1 p-3 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {issue.title}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {issue.teamKey}-{issue.number}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "size-2 rounded-full",
                          issue.status === "todo" ? "bg-slate-400" :
                          issue.status === "in_progress" ? "bg-amber-400" :
                          issue.status === "done" ? "bg-emerald-500" : "bg-muted"
                        )} />
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          {issue.status.replace("_", " ")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Agent Activity */}
          <Card className="flex flex-col border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="size-5 text-indigo-500" />
                Recent Automations
              </CardTitle>
              <CardDescription>The latest runs executed by your agentic loops.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {stats.recentActivity.length === 0 ? (
                <div className="h-32 flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  No recent loop activity.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((run) => (
                    <div key={run.id} className="flex items-start gap-3 text-sm">
                      <div className={cn(
                        "mt-0.5 rounded-full p-1 border",
                        run.status === "succeeded" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        run.status === "failed" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                        "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      )}>
                        {run.status === "succeeded" ? <CheckCircle2 className="size-3" /> :
                         run.status === "failed" ? <AlertCircle className="size-3" /> :
                         <Loader2 className="size-3 animate-spin" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-foreground leading-none">
                          Loop executed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {run.completedAt 
                            ? `Finished ${formatRelativeTime(run.completedAt)}`
                            : `Started ${formatRelativeTime(run.startedAt)}`}
                        </p>
                      </div>
                      <div className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {run.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
