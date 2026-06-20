"use client";

import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";
import { getToolName, isToolUIPart } from "ai";
import { Streamdown } from "streamdown";
import {
  CircleAlert,
  CircleCheck,
  Loader2,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { SkillToolCard, LoopToolCard, ScrapingToolCard, SubAgentToolCard } from "./generative-ui";

const TOOL_LABELS: Record<string, string> = {
  listTeams: "Looking up teams",
  listMembers: "Looking up members",
  projectStatus: "Checking project status",
  searchIssues: "Searching issues",
  findSimilarIssues: "Finding similar issues",
  createIssue: "Creating issue",
  updateIssue: "Updating issue",
  cycleSummary: "Summarizing cycle",
  standupReport: "Gathering standup data",
};

function DynamicThoughtCard({
  name,
  state,
  args,
  errorText,
}: {
  name: string;
  state: string;
  args?: any;
  errorText?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const running = state === "input-streaming" || state === "input-available";
  const failed = state === "output-error";
  
  return (
    <div className="flex flex-col gap-1 w-full max-w-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-all hover:bg-muted/60",
          running ? "bg-muted/40 border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)]" : "bg-muted/20 border-border text-muted-foreground",
          failed && "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
        )}
      >
        {running ? (
          <Loader2 className="size-3.5 text-primary animate-spin" />
        ) : failed ? (
          <CircleAlert className="size-3.5" />
        ) : (
          <CircleCheck className="size-3.5 text-emerald-500" />
        )}
        <span className={cn("font-medium", running && "text-foreground")}>
          {TOOL_LABELS[name] ?? name}
        </span>
        <ChevronRight className={cn("size-3.5 ml-1 transition-transform opacity-50", expanded && "rotate-90")} />
      </button>

      {expanded && args && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-1 overflow-hidden rounded-md border bg-muted/30 p-2.5 max-w-sm">
          <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(args, null, 2)}
          </pre>
          {failed && errorText && (
            <div className="mt-2 text-xs text-destructive border-t border-destructive/20 pt-2">
              {errorText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssistantText({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const [visibleText] = useSmoothText(text, { startStreaming: streaming });
  return (
    <Streamdown className="text-sm leading-relaxed [&_a]:underline [&_code]:text-xs">
      {visibleText}
    </Streamdown>
  );
}

/** One chat message: user prompt bubble or assistant parts (text + tools). */
export function AiMessage({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary/10 px-3 py-2 text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  const failed = message.status === "failed";
  return (
    <div className="flex flex-col gap-2">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          if (!part.text) {
            return null;
          }
          return (
            <AssistantText
              key={index}
              text={part.text}
              streaming={message.status === "streaming"}
            />
          );
        }
        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          
          if (toolName === "createSkill") {
            return (
              <SkillToolCard
                key={index}
                state={part.state}
                args={'input' in part ? part.input : undefined}
                result={'output' in part ? part.output : undefined}
              />
            );
          }
          
          if (toolName === "createLoop") {
            return (
              <LoopToolCard
                key={index}
                state={part.state}
                args={'input' in part ? part.input : undefined}
                result={'output' in part ? part.output : undefined}
              />
            );
          }

          if (toolName === "scrapeWebContent") {
            return (
              <ScrapingToolCard
                key={index}
                state={part.state}
                args={'input' in part ? part.input : undefined}
                result={'output' in part ? part.output : undefined}
              />
            );
          }

          if (toolName === "spawnResearchAgent") {
            return (
              <SubAgentToolCard
                key={index}
                state={part.state}
                args={'input' in part ? part.input : undefined}
                result={'output' in part ? part.output : undefined}
              />
            );
          }

          return (
            <DynamicThoughtCard
              key={index}
              name={toolName}
              state={part.state}
              args={'input' in part ? part.input : undefined}
              errorText={part.errorText}
            />
          );
        }
        return null;
      })}
      {failed && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs text-destructive",
            message.parts.length > 0 && "mt-1"
          )}
        >
          <CircleAlert className="size-3" />
          OpenGrove couldn&apos;t finish this response. Try sending your message
          again.
        </p>
      )}
    </div>
  );
}
