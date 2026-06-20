"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { CopyX, Loader2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IssueDetailSlotProps } from "@/components/issue-detail/slots";
import { IssuePriority, priorityLabel } from "@/components/shared/issue-meta";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StatusIcon } from "@/components/shared/status-icon";
import { convexErrorMessage } from "./convex-error";
import { useAiAccess } from "./use-ai-access";

type Duplicate = {
  issueId: Id<"issues">;
  identifier: string;
  title: string;
  status: Parameters<typeof StatusIcon>[0]["status"];
  priority: IssuePriority;
  assigneeName: string | null;
  similarity: number;
};

type Suggestion = {
  priority: IssuePriority;
  labels: { labelId: Id<"labels">; name: string; color: string }[];
  reasoning: string;
};

/**
 * AI triage slot on the issue detail page (Pro/Enterprise): semantic
 * duplicate detection + priority/label suggestions with one-click apply.
 */
export function AiTriagePanel(props: IssueDetailSlotProps) {
  const { isLoaded, hasAccess } = useAiAccess();
  if (!isLoaded || !hasAccess) {
    return null;
  }
  return <TriagePanelInner {...props} />;
}

function TriagePanelInner({ issue }: IssueDetailSlotProps) {
  const params = useParams<{ orgSlug: string }>();
  const findDuplicates = useAction(api.agent.triage.findDuplicates);
  const suggestTriage = useAction(api.agent.triage.suggestTriage);
  const ensureOrgEmbeddings = useMutation(api.agent.embeddings.ensureOrgEmbeddings);
  const updateIssue = useMutation(api.issues.update);
  const toggleLabel = useMutation(api.labels.toggleOnIssue);

  const [duplicates, setDuplicates] = useState<Duplicate[] | null>(null);
  const [duplicatesError, setDuplicatesError] = useState<string | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const pendingSuggestions = useQuery(api.agent.triage.getPendingSuggestions, { issueId: issue._id });
  const resolveSuggestionMutation = useMutation(api.agent.triage.resolveSuggestion);

  const handleResolveSuggestion = (commentId: Id<"comments">, accept: boolean) => {
    resolveSuggestionMutation({ commentId, accept })
      .then(() => toast.success(accept ? "Link accepted" : "Link discarded"))
      .catch((error: unknown) => toast.error(convexErrorMessage(error, "Failed to resolve link")));
  };

  // Auto-run duplicate detection once per issue view; also nudge the org
  // embedding backfill so older issues are searchable.
  const checkedIssueId = useRef<Id<"issues"> | null>(null);
  useEffect(() => {
    if (checkedIssueId.current === issue._id) {
      return;
    }
    checkedIssueId.current = issue._id;
    setDuplicates(null);
    setDuplicatesError(null);
    setSuggestion(null);
    setSuggestionError(null);
    setCheckingDuplicates(true);
    ensureOrgEmbeddings({}).catch(() => {
      // Non-critical background task.
    });
    findDuplicates({ issueId: issue._id })
      .then((result) => {
        if (checkedIssueId.current !== issue._id) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((result as any).ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setDuplicates((result as any).duplicates);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setDuplicatesError((result as any).error);
        }
      })
      .catch(() => {
        if (checkedIssueId.current !== issue._id) return;
        setDuplicatesError("Could not check for duplicates.");
      })
      .finally(() => {
        if (checkedIssueId.current !== issue._id) return;
        setCheckingDuplicates(false);
      });
  }, [issue._id, findDuplicates, ensureOrgEmbeddings]);

  const runSuggest = () => {
    setSuggesting(true);
    setSuggestionError(null);
    suggestTriage({ issueId: issue._id })
      .then((result) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((result as any).ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r = result as any;
          setSuggestion({
            priority: r.priority,
            labels: r.labels,
            reasoning: r.reasoning,
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSuggestionError((result as any).error);
        }
      })
      .catch(() => setSuggestionError("Could not generate suggestions."))
      .finally(() => setSuggesting(false));
  };

  const applyPriority = (priority: IssuePriority) => {
    updateIssue({ issueId: issue._id, priority })
      .then(() => toast.success(`Priority set to ${priorityLabel(priority)}`))
      .catch((error: unknown) =>
        toast.error(convexErrorMessage(error, "Failed to update priority"))
      );
  };

  const applyLabel = (label: Suggestion["labels"][number]) => {
    toggleLabel({ issueId: issue._id, labelId: label.labelId })
      .then(() => {
        toast.success(`Label "${label.name}" added`);
        setSuggestion((current) =>
          current
            ? {
                ...current,
                labels: current.labels.filter(
                  (l) => l.labelId !== label.labelId
                ),
              }
            : current
        );
      })
      .catch((error: unknown) =>
        toast.error(convexErrorMessage(error, "Failed to add label"))
      );
  };

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary" />
        <h3 className="text-xs font-medium">AI triage</h3>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-6 gap-1.5 px-2 text-xs"
          onClick={runSuggest}
          disabled={suggesting}
        >
          {suggesting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          Suggest priority & labels
        </Button>
      </div>

      {/* Duplicates */}
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <CopyX className="size-3" />
          Possible duplicates
        </p>
        {checkingDuplicates ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Scanning for similar issues…
          </p>
        ) : duplicatesError ? (
          <p className="text-xs text-muted-foreground">{duplicatesError}</p>
        ) : duplicates && duplicates.length > 0 ? (
          <ul className="flex flex-col">
            {duplicates.map((duplicate) => (
              <li key={duplicate.issueId}>
                <Link
                  href={`/${params.orgSlug}/issue/${duplicate.issueId}`}
                  className="flex h-7 items-center gap-2 rounded-md px-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <StatusIcon status={duplicate.status} className="size-3.5" />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {duplicate.identifier}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {duplicate.title}
                  </span>
                  <span className="shrink-0 rounded-full border px-1.5 text-[10px] text-muted-foreground">
                    {Math.round(duplicate.similarity * 100)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No likely duplicates found.
          </p>
        )}
      </div>

      {/* Suggestions */}
      {(suggestion || suggestionError) && (
        <>
          <Separator />
          {suggestionError ? (
            <p className="text-xs text-muted-foreground">{suggestionError}</p>
          ) : suggestion ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {suggestion.reasoning}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {suggestion.priority !== issue.priority && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 gap-1.5 px-2 text-xs"
                    onClick={() => applyPriority(suggestion.priority)}
                  >
                    <PriorityIcon
                      priority={suggestion.priority}
                      className="size-3"
                    />
                    Set {priorityLabel(suggestion.priority)}
                    <Plus className="size-3 text-muted-foreground" />
                  </Button>
                )}
                {suggestion.labels.map((label) => (
                  <button
                    key={label.labelId}
                    onClick={() => applyLabel(label)}
                    aria-label={`Add label ${label.name}`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Plus className="size-3" />
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))}
                {suggestion.priority === issue.priority &&
                  suggestion.labels.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Triage already matches the suggestion.
                    </span>
                  )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Semantic Link Suggestions */}
      {pendingSuggestions && pendingSuggestions.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="size-3" />
              Suggested links
            </p>
            <ul className="flex flex-col gap-2">
              {pendingSuggestions.map(({ commentId, suggestion }) => (
                <li key={commentId} className="flex flex-col gap-2 rounded-md border p-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">
                      {suggestion.type === "link_pr" 
                        ? `Does PR #${suggestion.prNumber} belong here?` 
                        : `Does commit ${suggestion.commitHash} belong here?`}
                    </span>
                    <span className="shrink-0 rounded-full border px-1.5 text-[10px] text-muted-foreground">
                      {suggestion.confidence}% match
                    </span>
                  </div>
                  <div className="font-medium line-clamp-2">
                    {suggestion.type === "link_pr" ? suggestion.prTitle : suggestion.message}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={() => handleResolveSuggestion(commentId, true)}>Accept</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => handleResolveSuggestion(commentId, false)}>Discard</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
