/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { 
  Repeat, Brain, Goal, Plus, ChevronDown, ChevronRight, 
  Play, Pause, Trash, CheckCircle2, Edit, MoreHorizontal, AlertCircle 
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiAccess } from "@/components/ai/use-ai-access";
import { CreateLoopDialog } from "@/components/loops/create-loop-dialog";
import { LoopTemplates } from "@/components/loops/loop-templates";

export default function LoopsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loops = useQuery(api.loops.listLoops);
  const skills = useQuery(api.skills.listSkills);
  const startLoop = useMutation(api.loops.startLoop);
  const aiAccess = useAiAccess();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!aiAccess.hasAccess) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6 border border-border shadow-sm">
          <Repeat className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Agentic Feedback Loops</h2>
        <p className="text-muted-foreground max-w-[500px] mb-8 leading-relaxed">
          The Loops Engine requires a Pro or Enterprise plan. Upgrade to let agents iteratively verify their own work until a goal is met.
        </p>
        <Button asChild size="lg" className="shadow-md transition-all hover:scale-105 active:scale-95">
          <a href={`/${orgSlug}/settings`}>Upgrade Plan</a>
        </Button>
      </div>
    );
  }

  const selectedLoop = loops?.find((l: any) => l._id === selectedId);

  // --- DETAIL VIEW ---
  if (selectedLoop) {
    const actionSkill = skills?.find((s: any) => s._id === selectedLoop.actionSkillId);
    const validationSkill = skills?.find((s: any) => s._id === selectedLoop.validationSkillId);
    
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
                Loops
              </span>
              <ChevronRight className="size-4" />
              <span className="text-foreground font-medium">{selectedLoop.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Pause className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Trash className="size-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="ml-2 font-medium bg-indigo-500 hover:bg-indigo-600 text-white"
                onClick={() => startLoop({ loopId: selectedLoop._id })}
              >
                <Repeat className="size-3.5 mr-2" fill="currentColor" />
                Run loop now
              </Button>
            </div>
          </div>

          {/* 2-Column Content */}
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left Main Content */}
            <div className="flex-1 space-y-8">
              <h1 className="text-3xl font-semibold tracking-tight">{selectedLoop.name}</h1>
              
              <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-2xl leading-relaxed">
                <p>
                  {selectedLoop.description || 
                   "This is an iterative feedback loop. An agent will repeatedly execute an action and self-evaluate until the goal is met."}
                </p>
              </div>

              <div className="pt-8 space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Action Skill (Worker)</h3>
                  <div className="flex items-center gap-2.5 text-sm p-3 border rounded-md bg-muted/20 w-fit">
                    <Brain className="size-4 text-primary" />
                    <span className="font-medium">{actionSkill?.name || "Unknown Skill"}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Validation Skill (Reviewer)</h3>
                  <div className="flex items-center gap-2.5 text-sm p-3 border rounded-md bg-muted/20 w-fit">
                    <Goal className="size-4 text-indigo-500" />
                    <span className="font-medium">{validationSkill?.name || "Unknown Skill"}</span>
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
                      <div className={`size-2 rounded-full ${selectedLoop.isEnabled ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-muted-foreground'}`} />
                      {selectedLoop.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">Worker Loop</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Iterations</span>
                    <span className="font-medium">{selectedLoop.maxIterations}</span>
                  </div>
                </div>
              </div>

              {/* Previous Runs Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Recent runs</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-2 font-medium text-emerald-500">
                      <CheckCircle2 className="size-4 transition-colors" /> 
                      Goal Reached
                    </span>
                    <span className="text-muted-foreground">2m</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-2 font-medium text-rose-500">
                      <AlertCircle className="size-4 transition-colors" /> 
                      Max Iterations
                    </span>
                    <span className="text-muted-foreground">1h</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                    <span className="flex items-center gap-2 font-medium text-emerald-500">
                      <CheckCircle2 className="size-4 transition-colors" /> 
                      Goal Reached
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
          <h1 className="text-2xl font-semibold tracking-tight">Agentic Loops</h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="font-medium" asChild>
              <a href={`/${orgSlug}/ai`}>
                Create via chat
                <ChevronRight className="ml-1.5 size-3.5 opacity-70" />
              </a>
            </Button>
            <CreateLoopDialog>
              <Button size="sm" variant="default" className="font-medium bg-indigo-500 hover:bg-indigo-600 text-white">
                <Plus className="size-4 mr-1" /> New Loop
              </Button>
            </CreateLoopDialog>
          </div>
        </div>

        {loops === undefined || skills === undefined ? (
          <div className="space-y-2 mt-8">
            <Skeleton className="h-4 w-16 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : loops.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10 mt-12">
            <Repeat className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">No loops found</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm">
              Create a feedback loop to let agents self-evaluate.
            </p>
            <CreateLoopDialog>
              <Button variant="secondary" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create loop
              </Button>
            </CreateLoopDialog>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">Current</h2>
            <div className="space-y-1">
              {loops.map((loop: any) => (
                <div 
                  key={loop._id}
                  onClick={() => setSelectedId(loop._id)}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 size-1.5 rounded-full ${loop.isEnabled ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-muted-foreground'}`} />
                    <span className="font-medium truncate">{loop.name}</span>
                    <span className="text-muted-foreground text-sm truncate opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
                      {loop.description || "Iterative Loop"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        startLoop({ loopId: loop._id });
                      }}
                    >
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

        {/* Template Gallery */}
        <LoopTemplates />
      </div>
    </div>
  );
}
