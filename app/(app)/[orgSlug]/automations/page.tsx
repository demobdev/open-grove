"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Zap, GitPullRequest, GitCommit, Settings2, FileText, Bot, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiAccess } from "@/components/ai/use-ai-access";
import { CreateAutomationDialog } from "@/components/automations/create-automation-dialog";

function TriggerIcon({ type }: { type: string }) {
  switch (type) {
    case "github_pr_opened":
    case "github_pr_merged":
      return <GitPullRequest className="size-4" />;
    case "github_push":
      return <GitCommit className="size-4" />;
    case "issue_created":
    case "issue_status_changed":
      return <FileText className="size-4" />;
    case "cron":
      return <Settings2 className="size-4" />;
    case "manual":
      return <Bot className="size-4" />;
    default:
      return <Zap className="size-4" />;
  }
}

function formatTrigger(type: string) {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function AutomationsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const automations = useQuery(api.automations.listAutomations);
  const skills = useQuery(api.skills.listSkills);
  const aiAccess = useAiAccess();

  if (!aiAccess.hasAccess) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6 border border-border shadow-sm">
          <Zap className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Automations Engine</h2>
        <p className="text-muted-foreground max-w-[500px] mb-8 leading-relaxed">
          The Automations Engine requires a Pro or Enterprise plan. Upgrade to map GitHub events to agentic skills dynamically.
        </p>
        <Button asChild size="lg" className="shadow-md transition-all hover:scale-105 active:scale-95">
          <a href={`/${orgSlug}/settings`}>Upgrade Plan</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="size-7 text-amber-500" />
              Automations
            </h1>
            <p className="text-muted-foreground mt-2">
              The &quot;If This Then That&quot; engine. Trigger agentic skills automatically on specific events.
            </p>
          </div>
          <CreateAutomationDialog />
        </div>

        {automations === undefined || skills === undefined ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border/50">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mb-4">
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No automations configured</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Connect a GitHub event to an AI Skill to start automating your workflows.
            </p>
            <CreateAutomationDialog>
              <Button variant="outline" className="transition-all hover:bg-muted/80">
                <Plus className="mr-2 h-4 w-4" />
                Create your first automation
              </Button>
            </CreateAutomationDialog>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation: any) => {
              const targetSkill = skills.find((s: any) => s._id === automation.targetSkillId);
              
              return (
                <Card 
                  key={automation._id} 
                  className="group flex flex-col overflow-hidden transition-all hover:border-amber-500/50 hover:shadow-md"
                >
                  <CardHeader className="pb-3 bg-muted/10 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <CardTitle className="text-lg transition-colors group-hover:text-amber-500">
                          {automation.name}
                        </CardTitle>
                      </div>
                      <Badge variant={automation.isEnabled ? "default" : "secondary"} className="shadow-sm">
                        {automation.isEnabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 py-4 space-y-4">
                    {automation.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {automation.description}
                      </p>
                    )}
                    
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] w-8">IF</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-background border rounded px-2 py-1 flex-1">
                          <TriggerIcon type={automation.triggerType} />
                          <span className="truncate">{formatTrigger(automation.triggerType)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] w-8">THEN</div>
                        <div className="flex items-center gap-1.5 text-primary bg-primary/5 border border-primary/10 rounded px-2 py-1 flex-1">
                          <Bot className="size-4" />
                          <span className="truncate font-medium">{targetSkill?.name || "Unknown Skill"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/10 px-6 py-4 flex items-center justify-between">
                    <Badge variant="outline" className="capitalize font-medium text-[10px] bg-background">
                      {automation.executionMode.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      Edit
                    </span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
