"use client";

import { useMutation, useQuery, useAction } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, CopyMinus, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  IssuePriority,
  IssueStatus,
  PRIORITIES,
  STATUSES,
} from "@/components/shared/issue-meta";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StatusIcon } from "@/components/shared/status-icon";

export function CreateIssueDialog({
  open,
  onOpenChange,
  defaultTeamId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTeamId?: Id<"teams">;
}) {
  const params = useParams<{ orgSlug?: string }>();
  const router = useRouter();
  const teams = useQuery(api.teams.list, open ? {} : "skip");
  const createIssue = useMutation(api.issues.create);
  const findDuplicates = useAction(api.agent.triage.findDuplicatesFromText);
  const suggestTriage = useAction(api.agent.triage.suggestTriageFromText);

  const [selectedTeamId, setSelectedTeamId] = useState<
    Id<"teams"> | undefined
  >(undefined);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("todo");
  const [priority, setPriority] = useState<IssuePriority>("none");
  const [submitting, setSubmitting] = useState(false);

  // AI State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [duplicates, setDuplicates] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setDuplicates([]);
      setAiSuggestion(null);
      setIsAiLoading(false);
      return;
    }
    const text = title + " " + description;
    if (text.trim().length < 10) {
      setDuplicates([]);
      setAiSuggestion(null);
      setIsAiLoading(false);
      return;
    }

    setIsAiLoading(true);
    const handler = setTimeout(async () => {
      try {
        const [dupRes, triageRes] = await Promise.all([
          findDuplicates({ title, description: description.trim() || undefined }),
          suggestTriage({ title, description: description.trim() || undefined }),
        ]);
        if (dupRes.ok) {
           setDuplicates(dupRes.duplicates);
        }
        if (triageRes.ok) {
           setAiSuggestion({
             priority: triageRes.priority,
             labels: triageRes.labels,
             reasoning: triageRes.reasoning,
           });
        }
      } catch (err) {
        console.error("AI actions failed", err);
      } finally {
        setIsAiLoading(false);
      }
    }, 800);
    return () => clearTimeout(handler);
  }, [title, description, open, findDuplicates, suggestTriage]);

  // Fall back to the default/first team without needing an effect.
  const teamId = selectedTeamId ?? defaultTeamId ?? teams?.[0]?._id;

  const handleSubmit = async () => {
    if (!teamId || !title.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const issueId = await createIssue({
        teamId,
        title,
        description: description.trim() || undefined,
        status,
        priority,
      });
      toast.success("Issue created");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("none");
      if (params.orgSlug) {
        router.push(`/${params.orgSlug}/issue/${issueId}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create issue"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            New issue
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                void handleSubmit();
              }
            }}
            className="border-none px-0 text-lg font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Textarea
            placeholder="Add description…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 resize-none border-none px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={teamId ?? ""}
              onValueChange={(value) => setSelectedTeamId(value as Id<"teams">)}
            >
              <SelectTrigger size="sm" className="w-auto gap-1.5">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.key} · {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as IssueStatus)}
            >
              <SelectTrigger size="sm" className="w-auto gap-1.5">
                <StatusIcon status={status} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as IssuePriority)}
            >
              <SelectTrigger size="sm" className="w-auto gap-1.5">
                <PriorityIcon priority={priority} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Duplicates & Suggestions */}
          {duplicates.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-amber-500">
                <CopyMinus className="h-4 w-4" />
                <span>Possible duplicates found</span>
              </div>
              <div className="flex flex-col gap-1">
                {duplicates.map((dup) => (
                  <div key={dup.issueId} className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-xs">{dup.identifier}</span>
                    <span className="truncate">{dup.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiSuggestion && aiSuggestion.priority !== "none" && priority === "none" && (
            <div 
              className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-indigo-500/20 bg-indigo-500/10 p-3 text-sm transition-colors hover:bg-indigo-500/20"
              onClick={() => setPriority(aiSuggestion.priority)}
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <div className="flex flex-col">
                <span className="font-medium text-indigo-500">
                  AI Suggests: {aiSuggestion.priority} Priority
                </span>
                <span className="text-xs text-muted-foreground">
                  {aiSuggestion.reasoning} (Click to apply)
                </span>
              </div>
            </div>
          )}

          {isAiLoading && !duplicates.length && !aiSuggestion && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>AI is analyzing...</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!title.trim() || !teamId || submitting}
            onClick={() => void handleSubmit()}
          >
            Create issue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
