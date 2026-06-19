"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Repeat, Brain, Goal, AlertCircle } from "lucide-react";
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
import { CreateLoopDialog } from "@/components/loops/create-loop-dialog";

export default function LoopsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loops = useQuery(api.loops.listLoops);
  const skills = useQuery(api.skills.listSkills);
  const aiAccess = useAiAccess();

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

  return (
    <div className="flex-1 overflow-auto p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Repeat className="size-7 text-indigo-500" />
              Loops Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Iterative agent execution. Define an action, set a goal, and let the agent work until it succeeds.
            </p>
          </div>
          <CreateLoopDialog />
        </div>

        {loops === undefined || skills === undefined ? (
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
        ) : loops.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-4">
              <Repeat className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No loops configured</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create a feedback loop to give your agents a goal to achieve through iteration.
            </p>
            <CreateLoopDialog>
              <Button variant="outline" className="transition-all hover:bg-muted/80">
                <CreateLoopDialog />
              </Button>
            </CreateLoopDialog>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loops.map((loop) => {
              const actionSkill = skills.find(s => s._id === loop.actionSkillId);
              const validationSkill = skills.find(s => s._id === loop.validationSkillId);
              
              return (
                <Card 
                  key={loop._id} 
                  className="group flex flex-col overflow-hidden transition-all hover:border-indigo-500/50 hover:shadow-md"
                >
                  <CardHeader className="pb-3 bg-muted/10 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <CardTitle className="text-lg transition-colors group-hover:text-indigo-500">
                          {loop.name}
                        </CardTitle>
                      </div>
                      <Badge variant={loop.isEnabled ? "default" : "secondary"} className="shadow-sm">
                        {loop.isEnabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 py-4 space-y-4">
                    {loop.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {loop.description}
                      </p>
                    )}
                    
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] w-12 text-right">ACTION</div>
                        <div className="flex items-center gap-1.5 text-primary bg-primary/5 border border-primary/10 rounded px-2 py-1 flex-1">
                          <Brain className="size-4" />
                          <span className="truncate font-medium">{actionSkill?.name || "Unknown Skill"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] w-12 text-right">GOAL</div>
                        <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-500/5 border border-indigo-500/10 rounded px-2 py-1 flex-1">
                          <Goal className="size-4" />
                          <span className="truncate font-medium">{validationSkill?.name || "Unknown Skill"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/10 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="size-3" />
                      <span>Max retries: {loop.maxIterations}</span>
                    </div>
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
