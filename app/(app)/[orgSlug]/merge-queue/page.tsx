"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { 
  GitMerge, GitPullRequest, GitBranch, Play, CheckCircle2, 
  XCircle, Clock, ChevronRight, Check, X, AlertCircle 
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MergeQueuePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const queue = useQuery(api.mergeQueue.listQueue, {});
  const batches = useQuery(api.mergeQueue.listBatches, {});
  
  const approveBatch = useMutation(api.mergeQueue.approveBatch);
  const cancelBatch = useMutation(api.mergeQueue.cancelBatch);
  const mergeBatch = useMutation(api.mergeQueue.mergeBatch);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedBatch = batches?.find((b: any) => b._id === selectedId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "creating": return "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]";
      case "testing": return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse";
      case "passed": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";
      case "awaiting_approval": return "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse";
      case "approved": return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]";
      case "merged": return "bg-slate-400";
      case "failed":
      case "cancelled": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]";
      default: return "bg-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // --- DETAIL VIEW ---
  if (selectedBatch) {
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
                Merge Queue
              </span>
              <ChevronRight className="size-4" />
              <span className="text-foreground font-medium">Batch {selectedBatch._id.slice(-6)}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedBatch.status === "awaiting_approval" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => cancelBatch({ batchId: selectedBatch._id })}>
                    <X className="size-4 mr-2" /> Reject
                  </Button>
                  <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => approveBatch({ batchId: selectedBatch._id })}>
                    <Check className="size-4 mr-2" /> Approve
                  </Button>
                </>
              )}
              {selectedBatch.status === "approved" && (
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white" onClick={() => mergeBatch({ batchId: selectedBatch._id })}>
                  <GitMerge className="size-4 mr-2" /> Merge Now
                </Button>
              )}
            </div>
          </div>

          {/* 2-Column Content */}
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left Main Content */}
            <div className="flex-1 space-y-8">
              <div className="flex items-center gap-4">
                <div className={`shrink-0 size-3 rounded-full ${getStatusColor(selectedBatch.status)}`} />
                <h1 className="text-3xl font-semibold tracking-tight">Integration Batch</h1>
              </div>
              
              <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-2xl leading-relaxed">
                <p>
                  This batch contains {selectedBatch.prNumbers.length} Pull Requests from <strong>{selectedBatch.repoFullName || selectedBatch.repoId}</strong>.
                  Deterministic file-overlap checks have passed, and the integration branch <code>{selectedBatch.branchName}</code> has been prepared.
                </p>
              </div>

              <div className="pt-8 space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Included Pull Requests</h3>
                  <div className="space-y-2">
                    {selectedBatch.prNumbers.map((pr: number) => (
                      <div key={pr} className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                        <GitPullRequest className="size-4 text-primary" />
                        <span className="font-medium">PR #{pr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Integration Branch</h3>
                  <div className="flex items-center gap-2.5 text-sm p-3 border rounded-md bg-muted/20 w-fit">
                    <GitBranch className="size-4 text-indigo-500" />
                    <span className="font-mono">{selectedBatch.branchName}</span>
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
                    <span className="text-muted-foreground">Current State</span>
                    <span className="flex items-center gap-2 font-medium">
                      {getStatusLabel(selectedBatch.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CI Status</span>
                    {selectedBatch.ciRunUrl ? (
                      <a href={selectedBatch.ciRunUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 hover:underline flex items-center gap-1">
                        View Logs <ChevronRight className="size-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Waiting</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(selectedBatch._creationTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Requirements */}
              {selectedBatch.status === "awaiting_approval" && (
                <div className="space-y-4 bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20">
                  <h3 className="text-sm font-medium text-indigo-500 flex items-center gap-2">
                    <AlertCircle className="size-4" /> Human Review Required
                  </h3>
                  <p className="text-sm text-indigo-500/80 leading-relaxed">
                    CI has passed. This batch requires explicit human approval before it can be merged into the main branch.
                  </p>
                </div>
              )}
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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Merge Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agentic Merge Queue powered by deterministic file-overlap conflict checks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="font-medium" asChild>
              <a href={`/${orgSlug}/ai`}>
                Create via chat
                <ChevronRight className="ml-1.5 size-3.5 opacity-70" />
              </a>
            </Button>
          </div>
        </div>

        {queue === undefined || batches === undefined ? (
          <div className="space-y-2 mt-8">
            <Skeleton className="h-4 w-16 mb-4" />
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* BATCHES */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">Active Batches</h2>
              {batches.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-muted/10">
                  <GitMerge className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">No batches in progress.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {batches.map((batch: any) => (
                    <div 
                      key={batch._id}
                      onClick={() => setSelectedId(batch._id)}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`shrink-0 size-2 rounded-full ${getStatusColor(batch.status)}`} />
                        <span className="font-medium truncate">{batch.repoFullName || batch.repoId}</span>
                        <span className="text-muted-foreground font-mono text-xs hidden sm:inline-block">
                          {batch.branchName}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50 text-xs font-medium text-muted-foreground">
                          <GitPullRequest className="size-3" />
                          {batch.prNumbers.length} PRs
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                          {getStatusLabel(batch.status)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUEUE */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">Waiting in Queue</h2>
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-muted/10">
                  <Clock className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">Queue is empty.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {queue.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/5 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{item.repoFullName || item.repoId}#{item.prNumber}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Added {new Date(item.addedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
