"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Loader2, GitBranch, Copy, Check, Info } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IntegrationsSettingsPage() {
  const org = useQuery(api.organizations.current);
  const [copied, setCopied] = useState(false);

  if (org === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (org === null) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Workspace not found.
      </p>
    );
  }

  // Determine webhook URL
  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://your-convex-deployment.convex.site";
  const webhookUrl = `${siteUrl}/github-webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div>
        <h1 className="text-base font-semibold">Integrations</h1>
        <p className="text-xs text-muted-foreground">
          Connect external developer tools to your workspace.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/5 ring-1 ring-foreground/10">
            <GitBranch className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <CardTitle>GitHub Link</CardTitle>
            <CardDescription>
              Connect your repos to auto-transition issues and link PRs/commits.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Your Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 rounded-md border bg-muted/50 px-3 py-1.5 text-xs select-all focus:outline-none"
              />
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="size-3.5 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground">
            <div className="flex gap-2 font-medium text-foreground mb-2">
              <Info className="size-4 shrink-0 text-sky-500" />
              Setup Instructions
            </div>
            <ol className="list-decimal list-inside space-y-2.5">
              <li>Open your repository settings page on <strong>GitHub</strong>.</li>
              <li>Navigate to <strong>Webhooks</strong> in the left sidebar and click <strong>Add webhook</strong>.</li>
              <li>Paste your unique Webhook URL above into the <strong>Payload URL</strong> field.</li>
              <li>Set <strong>Content type</strong> to <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">application/json</code>.</li>
              <li>Under which events trigger this webhook, select <strong>Let me select individual events</strong>.</li>
              <li>Check <strong>Pushes</strong> and <strong>Pull requests</strong>, then click <strong>Add webhook</strong>.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-foreground">How it works</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <span className="text-xs font-medium text-foreground block mb-1">
                  1. Branching & PRs
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Include your issue identifier (e.g., <code className="bg-muted px-1 rounded font-mono">ENG-12</code>) in your branch name or PR title. When the PR is opened, OpenGrove will auto-transition the issue to <strong>In Progress</strong> and add a link to the PR.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <span className="text-xs font-medium text-foreground block mb-1">
                  2. Commits & Merging
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Reference issue IDs in your commit messages to log them. Once a linked PR is merged, the issue status will automatically transition to <strong>Done</strong>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
