"use client";

import { useParams } from "next/navigation";
import { Loader2, Zap, CircleCheck, Brain, ArrowRight, ScanLine, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Skill Tool Card ---

interface SkillArgs {
  name?: string;
  description?: string;
  type?: string;
}

interface SkillResult {
  skillId?: string;
}

export function SkillToolCard({
  state,
  args,
  result,
}: {
  state: string;
  args?: any;
  result?: any;
}) {
  const params = useParams<{ orgSlug: string }>();
  
  const toolArgs = (args as SkillArgs) || {};
  
  const parsedResult = result as SkillResult | undefined;
  const isFinished = state === "output-available";
  const isError = state === "output-error";

  return (
    <Card className={cn(
      "overflow-hidden max-w-sm mt-2 transition-all duration-500 bg-background/50 backdrop-blur-sm",
      isFinished ? "border-emerald-500/20 shadow-emerald-500/10" : "border-border",
      isError && "border-destructive/20 shadow-destructive/10"
    )}>
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isFinished ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground",
            isError && "bg-destructive/10 border-destructive/20 text-destructive"
          )}>
            <Brain className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium truncate text-foreground">
              {toolArgs.name || "AI Skill"}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFinished ? (
                <CircleCheck className="size-3 text-emerald-500" />
              ) : isError ? (
                <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
              ) : (
                <Loader2 className="size-3 text-muted-foreground animate-spin" />
              )}
              <p className="text-xs text-muted-foreground capitalize">
                {state === "output-available" ? "Skill Active" : state.replace("-", " ")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {toolArgs.description && (
        <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border/50">
          <p className="line-clamp-2 leading-relaxed">{toolArgs.description}</p>
        </div>
      )}
      
      {isFinished && (
        <div className="p-3 bg-muted/10">
          <Button variant="secondary" size="sm" className="w-full text-xs h-8 font-medium shadow-sm transition-all hover:scale-[1.02]" asChild>
            <a href={`/${params.orgSlug}/settings`}>
              View in Settings
              <ArrowRight className="ml-1.5 size-3" />
            </a>
          </Button>
        </div>
      )}
    </Card>
  );
}

// --- Loop Tool Card ---

interface LoopArgs {
  name?: string;
  description?: string;
  actionSkillId?: string;
  validationSkillId?: string;
}

interface LoopResult {
  loopId?: string;
}

export function LoopToolCard({
  state,
  args,
  result,
}: {
  state: string;
  args?: any;
  result?: any;
}) {
  const params = useParams<{ orgSlug: string }>();
  
  const toolArgs = (args as LoopArgs) || {};
  
  const parsedResult = result as LoopResult | undefined;
  const isFinished = state === "output-available";
  const isError = state === "output-error";

  return (
    <Card className={cn(
      "overflow-hidden max-w-sm mt-2 transition-all duration-500 bg-background/50 backdrop-blur-sm",
      isFinished ? "border-indigo-500/20 shadow-indigo-500/10" : "border-border",
      isError && "border-destructive/20 shadow-destructive/10"
    )}>
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isFinished ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" : "bg-muted text-muted-foreground",
            isError && "bg-destructive/10 border-destructive/20 text-destructive"
          )}>
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium truncate text-foreground">
              {toolArgs.name || "Agentic Loop"}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFinished ? (
                <CircleCheck className="size-3 text-indigo-500" />
              ) : isError ? (
                <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
              ) : (
                <Loader2 className="size-3 text-muted-foreground animate-spin" />
              )}
              <p className="text-xs text-muted-foreground capitalize">
                {state === "output-available" ? "Loop Configured" : state.replace("-", " ")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {toolArgs.description && (
        <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border/50">
          <p className="line-clamp-2 leading-relaxed">{toolArgs.description}</p>
        </div>
      )}
      
      {isFinished && (
        <div className="p-3 bg-muted/10">
          <Button variant="default" size="sm" className={cn(
            "w-full text-xs h-8 font-medium shadow-sm transition-all hover:scale-[1.02]",
            "bg-indigo-500 hover:bg-indigo-600 text-white"
          )} asChild>
            <a href={`/${params.orgSlug}/loops`}>
              Open Loops Dashboard
              <ArrowRight className="ml-1.5 size-3" />
            </a>
          </Button>
        </div>
      )}
    </Card>
  );
}

// --- Scraping Tool Card ---

interface ScrapingArgs {
  url?: string;
}

export function ScrapingToolCard({
  state,
  args,
  result,
}: {
  state: string;
  args?: any;
  result?: any;
}) {
  const toolArgs = (args as ScrapingArgs) || {};
  const isFinished = state === "output-available";
  const isError = state === "output-error";

  return (
    <Card className={cn(
      "overflow-hidden max-w-sm mt-2 transition-all duration-500 bg-background/50 backdrop-blur-sm",
      isFinished ? "border-amber-500/20 shadow-amber-500/10" : "border-border",
      isError && "border-destructive/20 shadow-destructive/10"
    )}>
      <div className="p-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isFinished ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground",
            isError && "bg-destructive/10 border-destructive/20 text-destructive"
          )}>
            <ScanLine className={cn("h-4 w-4", !isFinished && !isError && "animate-pulse")} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium truncate text-foreground">
              Reading Website
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFinished ? (
                <CircleCheck className="size-3 text-amber-500" />
              ) : isError ? (
                <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
              ) : (
                <Loader2 className="size-3 text-muted-foreground animate-spin" />
              )}
              <p className="text-xs text-muted-foreground capitalize truncate">
                {state === "output-available" ? "Scraping Complete" : toolArgs.url || "Scanning URL..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// --- Sub-Agent Tool Card ---

interface SubAgentArgs {
  task?: string;
}

export function SubAgentToolCard({
  state,
  args,
  result,
}: {
  state: string;
  args?: any;
  result?: any;
}) {
  const toolArgs = (args as SubAgentArgs) || {};
  const isFinished = state === "output-available";
  const isError = state === "output-error";

  return (
    <Card className={cn(
      "overflow-hidden max-w-sm mt-2 transition-all duration-500 bg-background/50 backdrop-blur-sm",
      isFinished ? "border-sky-500/20 shadow-sky-500/10" : "border-border",
      isError && "border-destructive/20 shadow-destructive/10"
    )}>
      <div className="p-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isFinished ? "bg-sky-500/10 border-sky-500/20 text-sky-500" : "bg-muted text-muted-foreground",
            isError && "bg-destructive/10 border-destructive/20 text-destructive"
          )}>
            <Network className={cn("h-4 w-4", !isFinished && !isError && "animate-pulse")} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium truncate text-foreground">
              Spawning Sub-Agent
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFinished ? (
                <CircleCheck className="size-3 text-sky-500" />
              ) : isError ? (
                <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
              ) : (
                <Loader2 className="size-3 text-muted-foreground animate-spin" />
              )}
              <p className="text-xs text-muted-foreground capitalize">
                {state === "output-available" ? "Research Completed" : "Delegating Task..."}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {toolArgs.task && (
        <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border/50">
          <p className="line-clamp-2 leading-relaxed">{toolArgs.task}</p>
        </div>
      )}
    </Card>
  );
}
