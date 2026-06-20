/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { 
  Zap, GitPullRequest, GitCommit, Settings2, FileText, Bot, Plus, 
  ChevronDown, ChevronRight, Play, Pause, Trash, CheckCircle2, 
  Edit, MoreHorizontal 
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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

  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selectedAutomation = automations?.find((a: any) => a._id === selectedId);

  // --- DETAIL VIEW ---
  if (selectedAutomation) {
    const targetSkill = skills?.find((s: any) => s._id === selectedAutomation.targetSkillId);
    
    return (
      <div className="flex-1 overflow-auto bg-background p-8 animate-in fade-in duration-300">
        <div className="mx-auto max-w-6xl flex flex-col h-full">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span 
                onClick={() => setSelectedId(null)} 
                className="cursor-pointer hover:text-foreground transition-colors"
              >
                Automations
              </span>
              <ChevronRight className="size-4" />
              <span className="text-foreground font-medium">{selectedAutomation.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Pause className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Trash className="size-4" />
              </Button>
              <Button variant="secondary" size="sm" className="ml-2 font-medium bg-secondary text-secondary-foreground">
                <Play className="size-3.5 mr-2" fill="currentColor" />
                Run now
              </Button>
            </div>
          </div>

          {/* 2-Column Content */}
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left Main Content */}
            <div className="flex-1 space-y-8">
              <h1 className="text-3xl font-semibold tracking-tight">{selectedAutomation.name}</h1>
              
              <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-2xl leading-relaxed">
                <p>
                  {selectedAutomation.description || 
                   "This automation runs automatically based on your defined triggers. Configure its execution flow and logic."}
                </p>
              </div>

              <div className="pt-8 space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Trigger Event</h3>
                  <div className="flex items-center gap-2.5 text-sm p-3 border rounded-md bg-muted/20 w-fit">
                    <TriggerIcon type={selectedAutomation.triggerType} />
                    <span className="font-medium">{formatTrigger(selectedAutomation.triggerType)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Target Execution</h3>
                  <div className="flex items-center gap-2.5 text-sm p-3 border rounded-md bg-muted/20 w-fit">
                    <Bot className="size-4 text-primary" />
                    <span className="font-medium">
                      {targetSkill?.name || (selectedAutomation.targetLoopId ? "Loop Orchestrator" : "Unknown")}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs bg-muted px-2 py-0.5 rounded uppercase tracking-wider">
                      {selectedAutomation.executionMode.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Metadata */}
            <div className="w-full lg:w-80 shrink-0 space-y-10">
              
              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-2 font-medium">
                      <div className={`size-2 rounded-full ${selectedAutomation.isEnabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {selectedAutomation.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next run</span>
                    <span className="font-medium">Tomorrow at 09:01</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last ran</span>
                    <span className="font-medium">Today at 10:35</span>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Runs in</span>
                    <span className="font-medium">Cloud</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Project</span>
                    <span className="font-medium">{orgSlug}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Repeats</span>
                    <span className="font-medium">
                      {selectedAutomation.triggerType === "cron" ? "Scheduled" : "Event-based"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">GPT-4o</span>
                  </div>
                </div>
              </div>

              {/* Previous Runs Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Previous runs</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" /> 
                      {selectedAutomation.name}
                    </span>
                    <span className="text-muted-foreground">2m</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" /> 
                      {selectedAutomation.name}
                    </span>
                    <span className="text-muted-foreground">1h</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" /> 
                      {selectedAutomation.name}
                    </span>
                    <span className="text-muted-foreground">1d</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="flex-1 overflow-auto bg-background p-8 animate-in fade-in duration-300">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="font-medium" asChild>
              <a href={`/${orgSlug}/ai`}>
                Create via chat
                <ChevronRight className="ml-1.5 size-3.5 opacity-70" />
              </a>
            </Button>
            <CreateAutomationDialog>
              <Button size="sm" variant="default" className="font-medium">
                <Plus className="size-4 mr-1" /> New
              </Button>
            </CreateAutomationDialog>
          </div>
        </div>

        {automations === undefined || skills === undefined ? (
          <div className="space-y-2 mt-8">
            <Skeleton className="h-4 w-16 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10 mt-12">
            <Zap className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">No automations found</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm">
              Connect a GitHub event to an AI Skill or create a loop.
            </p>
            <CreateAutomationDialog>
              <Button variant="secondary" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create automation
              </Button>
            </CreateAutomationDialog>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">Current</h2>
            <div className="space-y-1">
              {automations.map((automation: any) => (
                <div 
                  key={automation._id}
                  onClick={() => setSelectedId(automation._id)}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 size-1.5 rounded-full ${automation.isEnabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                    <span className="font-medium truncate">{automation.name}</span>
                    <span className="text-muted-foreground text-sm truncate opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
                      {automation.description || formatTrigger(automation.triggerType)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                      <Play className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
