"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MergeQueuePage() {
  const params = useParams<{ orgSlug: string }>();
  
  // Actually, we need to get the orgId from the slug first, or use the pre-resolved workspace data
  // Assuming useQuery(api.mergeQueue.listQueue) uses ctx.org internally based on JWT
  const queue = useQuery(api.mergeQueue.listQueue, {});
  const batches = useQuery(api.mergeQueue.listBatches, {});

  if (queue === undefined || batches === undefined) {
    return <div className="p-8 text-muted-foreground">Loading queue...</div>;
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merge Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agentic Merge Queue powered by deterministic file-overlap conflict checks.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Queued PRs */}
          <Card>
            <CardHeader>
              <CardTitle>Queued PRs</CardTitle>
              <CardDescription>Pull requests waiting to be batched and tested.</CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No PRs in queue.</p>
              ) : (
                <ul className="space-y-4">
                  {queue.map((item) => (
                    <li key={item._id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{item.repoId}#{item.prNumber}</p>
                        <p className="text-xs text-muted-foreground">Added {new Date(item.addedAt).toLocaleString()}</p>
                      </div>
                      <Badge variant={item.status === "failed" ? "destructive" : "secondary"}>
                        {item.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Batches</CardTitle>
              <CardDescription>Integration branches testing combined PRs.</CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No batches processed yet.</p>
              ) : (
                <ul className="space-y-4">
                  {batches.map((batch) => (
                    <li key={batch._id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{batch.repoId}</p>
                        <p className="text-xs text-muted-foreground font-mono">{batch.branchName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PRs: {batch.prNumbers.join(", ")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={batch.status === "passed" ? "default" : batch.status === "failed" ? "destructive" : "secondary"}>
                          {batch.status}
                        </Badge>
                        {batch.status === "passed" && (
                          <Button size="sm" variant="outline">Merge</Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
