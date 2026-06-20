"use client";

import { optimisticallySendMessage } from "@convex-dev/agent/react";
import { useMutation, useQuery } from "convex/react";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AiComposer } from "./composer";
import { convexErrorMessage } from "./convex-error";
import { AiConversation } from "./conversation";
import { QuotaPill } from "./quota-pill";
import { ThreadList } from "./thread-list";
import { AiUpgradeCta } from "./upgrade-cta";
import { useAiAccess } from "./use-ai-access";

const SUGGESTIONS = [
  "What should I work on next?",
  "Write a standup report for the last 24 hours",
  "Summarize the current cycle",
  "Find issues that look like duplicates",
];

export function AiAgentPage({ initialQuery }: { initialQuery?: string }) {
  const { isLoaded, hasAccess } = useAiAccess();

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!hasAccess) {
    return <AiUpgradeCta />;
  }
  return <AiWorkspace initialQuery={initialQuery} />;
}

function AiWorkspace({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const threads = useQuery(api.agent.chat.listThreads);
  const quota = useQuery(api.agent.chat.quota);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const createThread = useMutation(api.agent.chat.createThread);
  const deleteThread = useMutation(api.agent.chat.deleteThread);
  const ensureOrgEmbeddings = useMutation(api.agent.embeddings.ensureOrgEmbeddings);
  const sendMessage = useMutation(
    api.agent.chat.sendMessage
  ).withOptimisticUpdate((store, args) => {
    optimisticallySendMessage(api.agent.chat.listMessages)(store, {
      threadId: args.threadId,
      prompt: args.prompt,
    });
  });

  // Kick the semantic-index backfill once per visit (idempotent no-op when
  // every issue already has an embedding).
  const backfillRequested = useRef(false);
  useEffect(() => {
    if (!backfillRequested.current) {
      backfillRequested.current = true;
      ensureOrgEmbeddings({}).catch(() => {
        // Non-critical background task.
      });
    }
  }, [ensureOrgEmbeddings]);

  const quotaExhausted =
    quota !== undefined &&
    quota.hasAccess &&
    !quota.unlimited &&
    quota.remaining <= 0;

  const send = async (prompt: string) => {
    try {
      let threadId = selectedThreadId;
      if (!threadId) {
        threadId = await createThread({});
        setSelectedThreadId(threadId);
      }
      await sendMessage({ threadId, prompt });
    } catch (error) {
      toast.error(
        convexErrorMessage(error, "Failed to send message. Please try again.")
      );
      throw error;
    }
  };

  useEffect(() => {
    if (initialQuery && !quotaExhausted) {
      void send(initialQuery);
      router.replace(pathname); // Strip the query param after consuming
    }
  }, [initialQuery, quotaExhausted, router, pathname]);

  const removeThread = (threadId: string) => {
    deleteThread({ threadId })
      .then(() => {
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
        }
      })
      .catch((error: unknown) => {
        toast.error(
          convexErrorMessage(error, "Failed to delete conversation.")
        );
      });
  };

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <Bot className="size-4 text-primary" />
        <h1 className="text-sm font-medium">AI Agent</h1>
        <div className="ml-auto">
          <QuotaPill quota={quota} />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <ThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelect={setSelectedThreadId}
          onNew={() => setSelectedThreadId(null)}
          onDelete={removeThread}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          {selectedThreadId ? (
            <AiConversation threadId={selectedThreadId} />
          ) : (
            <EmptyState onSuggestion={send} disabled={quotaExhausted} />
          )}
          <AiComposer
            disabled={quotaExhausted}
            disabledReason="Daily AI message limit reached — upgrade to Enterprise for unlimited messages"
            onSend={send}
          />
        </main>
      </div>
    </>
  );
}

function EmptyState({
  onSuggestion,
  disabled,
}: {
  onSuggestion: (prompt: string) => Promise<void>;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-inner">
          <Sparkles className="size-7 text-indigo-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Ask OpenGrove AI</h2>
          <p className="text-muted-foreground text-sm max-w-[400px] mx-auto leading-relaxed">
            OpenGrove knows your teams, issues, projects and cycles — and can
            create, update, or analyze them for you. Let's get to work.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="default"
              disabled={disabled}
              className="h-auto justify-start font-normal text-muted-foreground whitespace-normal text-left py-3 px-4 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-foreground transition-all"
              onClick={() => void onSuggestion(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

