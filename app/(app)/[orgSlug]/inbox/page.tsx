"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import {
  Bell,
  MessageSquare,
  AtSign,
  Info,
  Loader2,
  Inbox,
  ArrowRight,
  Bot,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function InboxPage() {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const notifications = useQuery(api.inbox.listNotifications);
  const aiSuggestions = useQuery(api.aiSuggestions.listPending);
  const acceptSuggestion = useMutation(api.aiSuggestions.accept);
  const rejectSuggestion = useMutation(api.aiSuggestions.reject);
  const [filter, setFilter] = useState<"all" | "mentions" | "updates" | "ai_suggestions">("all");

  if (notifications === undefined || aiSuggestions === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "mentions") return item.type === "mention";
    if (filter === "updates") return item.type === "activity" || item.type === "comment";
    return true;
  });

  const handleRowClick = (issueId: string) => {
    router.push(`/${params.orgSlug}/issue/${issueId}`);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-foreground" />
          <h1 className="text-sm font-semibold">Inbox</h1>
        </div>
        
        {/* Tabs Filter */}
        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded px-2.5 py-1 transition-all",
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("mentions")}
            className={cn(
              "rounded px-2.5 py-1 transition-all",
              filter === "mentions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mentions
          </button>
          <button
            onClick={() => setFilter("updates")}
            className={cn(
              "rounded px-2.5 py-1 transition-all",
              filter === "updates"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Updates
          </button>
          <button
            onClick={() => setFilter("ai_suggestions")}
            className={cn(
              "rounded px-2.5 py-1 transition-all flex items-center gap-1",
              filter === "ai_suggestions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="size-3" />
            AI Suggestions
            {aiSuggestions.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {aiSuggestions.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Notification Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
            {filter === "ai_suggestions" ? (
              aiSuggestions.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted/40">
                    <Bot className="size-6 text-muted-foreground/60" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">All caught up</h3>
                    <p className="text-xs text-muted-foreground">
                      No pending AI suggestions.
                    </p>
                  </div>
                </div>
              ) : (
                aiSuggestions.map((suggestion) => {
                  const isPR = !!suggestion.prNumber;
                  const relativeTime = formatRelativeTime(suggestion._creationTime);
                  
                  return (
                    <div
                      key={suggestion._id}
                      className="group relative flex flex-col gap-3 rounded-lg border border-border/40 bg-card/30 p-4 transition-all duration-200 hover:border-border hover:bg-card/75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="size-5 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">Semantic Match Suggestion</span>
                            <span className="text-xs text-muted-foreground">{relativeTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => acceptSuggestion({ suggestionId: suggestion._id })}
                            className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-500/20"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => rejectSuggestion({ suggestionId: suggestion._id })}
                            className="flex items-center gap-1 rounded bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/20"
                          >
                            <XCircle className="size-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                          {suggestion.issueKey}
                        </span>
                        <span 
                          className="truncate hover:text-primary transition-colors cursor-pointer"
                          onClick={() => handleRowClick(suggestion.issueId)}
                        >
                          {suggestion.issueTitle}
                        </span>
                      </div>

                      <div className="rounded bg-muted/30 border-l-2 border-primary/40 px-3 py-2 text-xs text-muted-foreground font-normal whitespace-pre-wrap">
                        {suggestion.reason}
                      </div>
                    </div>
                  );
                })
              )
            ) : filteredNotifications.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted/40">
                  <Inbox className="size-6 text-muted-foreground/60" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">All caught up</h3>
                  <p className="text-xs text-muted-foreground">
                    {filter === "all"
                      ? "You don't have any notifications at the moment."
                      : filter === "mentions"
                        ? "No comments mention you."
                        : "No issue updates found."}
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const relativeTime = formatRelativeTime(item.timestamp);
                
                // Determine visual icon and description
                let actionIcon = <Info className="size-3 text-blue-500" />;
                let actionDesc = "";

                if (item.type === "mention") {
                  actionIcon = <AtSign className="size-3 text-rose-500" />;
                  actionDesc = "mentioned you in a comment";
                } else if (item.type === "comment") {
                  actionIcon = <MessageSquare className="size-3 text-indigo-400" />;
                  actionDesc = "commented";
                } else if (item.type === "activity") {
                  const actType = item.data.activityType;
                  if (actType === "created") {
                    actionDesc = "created this issue";
                  } else if (actType === "status_changed") {
                    actionDesc = `changed status to ${item.data.newValue?.replace("_", " ")}`;
                  } else if (actType === "priority_changed") {
                    actionDesc = `changed priority to ${item.data.newValue}`;
                  } else if (actType === "assignee_changed") {
                    actionDesc = "updated assignee";
                  } else {
                    actionDesc = "updated this issue";
                  }
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleRowClick(item.issueId)}
                    className="group relative flex cursor-pointer gap-4 rounded-lg border border-border/40 bg-card/30 p-4 transition-all duration-200 hover:border-border hover:bg-card/75"
                  >
                    {/* Left Avatar Indicator */}
                    <div className="relative shrink-0">
                      <UserAvatar
                        name={item.actorName}
                        imageUrl={item.actorImageUrl}
                        className="size-8 rounded-full border border-border/50"
                      />
                      <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                        {actionIcon}
                      </span>
                    </div>

                    {/* Middle Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{item.actorName}</span>
                          {" "}{actionDesc}
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 shrink-0">
                          {relativeTime}
                        </span>
                      </div>

                      {/* Issue Link Info */}
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                          {item.issueKey}
                        </span>
                        <span className="truncate group-hover:text-primary transition-colors">
                          {item.issueTitle}
                        </span>
                      </div>

                      {/* Comment Body snippet if exists */}
                      {item.data.body && (
                        <div className="mt-1 rounded bg-muted/30 border-l-2 border-primary/40 px-3 py-2 text-xs text-muted-foreground font-normal line-clamp-3">
                          {item.data.body}
                        </div>
                      )}

                      {/* Action type detail for status/priority change */}
                      {item.data.activityType === "status_changed" && item.data.newValue && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-normal">
                          {item.data.oldValue && (
                            <>
                              <StatusIcon status={item.data.oldValue as "backlog" | "todo" | "in_progress" | "in_review" | "done" | "canceled"} className="size-3.5" />
                              <span className="font-mono text-[10px]">{item.data.oldValue}</span>
                              <ArrowRight className="size-3" />
                            </>
                          )}
                          <StatusIcon status={item.data.newValue as "backlog" | "todo" | "in_progress" | "in_review" | "done" | "canceled"} className="size-3.5" />
                          <span className="font-mono text-[10px] text-foreground font-semibold">
                            {item.data.newValue}
                          </span>
                        </div>
                      )}

                      {item.data.activityType === "priority_changed" && item.data.newValue && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-normal">
                          {item.data.oldValue && (
                            <>
                              <PriorityIcon priority={item.data.oldValue as "none" | "urgent" | "high" | "medium" | "low"} className="size-3.5" />
                              <span className="font-mono text-[10px]">{item.data.oldValue}</span>
                              <ArrowRight className="size-3" />
                            </>
                          )}
                          <PriorityIcon priority={item.data.newValue as "none" | "urgent" | "high" | "medium" | "low"} className="size-3.5" />
                          <span className="font-mono text-[10px] text-foreground font-semibold">
                            {item.data.newValue}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
      </div>
    </div>
  );
}
