"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import {
  Loader2,
  GitBranch,
  Copy,
  Check,
  Info,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Send,
  ChevronDown,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface GitHubRepo {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
}

export default function IntegrationsSettingsPage() {
  const org = useQuery(api.organizations.current);
  const connectedRepos = useQuery(api.githubConnection.listConnectedRepos);
  
  const fetchUserRepos = useAction(api.githubConnection.listUserRepositories);
  const connectRepo = useMutation(api.githubConnection.connectRepo);
  const disconnectRepo = useMutation(api.githubConnection.disconnectRepo);

  const slackWebhook = useQuery(api.slack.getSlackWebhook);
  const saveSlackWebhook = useMutation(api.slack.saveSlackWebhook);
  const sendTestMessage = useAction(api.slack.sendTestMessage);

  const [copied, setCopied] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const [slackUrl, setSlackUrl] = useState("");
  const [savingSlack, setSavingSlack] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRepos() {
      setLoadingRepos(true);
      setReposError(null);
      try {
        const res = await fetchUserRepos();
        if (!active) return;
        
        if (res.success && res.repos) {
          setGithubRepos(res.repos);
        } else if (res.error) {
          setReposError(res.error);
        }
      } catch (err) {
        console.error("Failed to load GitHub repos:", err);
        if (active) {
          setReposError("failed_to_fetch");
        }
      } finally {
        if (active) {
          setLoadingRepos(false);
        }
      }
    }

    loadRepos();
    return () => {
      active = false;
    };
  }, [fetchUserRepos]);

  useEffect(() => {
    if (slackWebhook !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlackUrl(slackWebhook ?? "");
    }
  }, [slackWebhook]);

  if (org === undefined || connectedRepos === undefined || slackWebhook === undefined) {
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

  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://your-convex-deployment.convex.site";
  const webhookUrl = `${siteUrl}/github-webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Webhook URL copied to clipboard");
  };

  const handleConnect = async () => {
    if (!selectedRepo) return;
    setConnecting(true);
    try {
      await connectRepo({ repoName: selectedRepo });
      toast.success(`Connected ${selectedRepo}`);
      setSelectedRepo("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect repository");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (repoName: string) => {
    try {
      await disconnectRepo({ repoName });
      toast.success(`Disconnected ${repoName}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to disconnect repository");
    }
  };

  const handleSaveSlack = async () => {
    setSavingSlack(true);
    try {
      await saveSlackWebhook({ webhookUrl: slackUrl });
      toast.success("Slack Webhook URL saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save Slack Webhook");
    } finally {
      setSavingSlack(false);
    }
  };

  const handleTestSlack = async () => {
    if (!slackUrl) {
      toast.error("Please enter a Webhook URL first");
      return;
    }
    setTestingSlack(true);
    try {
      const res = await sendTestMessage({ webhookUrl: slackUrl });
      if (res.success) {
        toast.success("Test notification sent successfully to Slack!");
      } else {
        toast.error(`Failed to send test message: ${res.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send test message");
    } finally {
      setTestingSlack(false);
    }
  };

  // Filter connectedRepos to exclude Slack webhooks
  const gitRepos = connectedRepos.filter((r) => !r.repoName.startsWith("slack:"));
  const connectedNames = new Set(gitRepos.map((r) => r.repoName));
  const availableRepos = githubRepos.filter((r) => !connectedNames.has(r.fullName));

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-base font-semibold">Integrations</h1>
        <p className="text-xs text-muted-foreground">
          Connect external developer tools and notification systems to your workspace.
        </p>
      </div>

      {/* GitHub Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/5 ring-1 ring-foreground/10">
            <GitBranch className="size-6 text-foreground" />
          </div>
          <div className="flex flex-col gap-0.5">
            <CardTitle>GitHub Link</CardTitle>
            <CardDescription>
              Connect your repos to auto-transition issues and link PRs/commits.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          {/* Dropdown Repo Connection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">
              Link Repository
            </label>
            {loadingRepos ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground h-9 border rounded-md px-3 bg-muted/20">
                <Loader2 className="size-3.5 animate-spin" />
                Loading your GitHub repositories...
              </div>
            ) : reposError === "not_linked" ? (
              <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  Your GitHub account is not connected to your profile. Click your profile avatar in the bottom-left corner of the sidebar, go to **Manage Account**, and link your **GitHub** account under **Social accounts** to list your repositories.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Once connected, refresh this page to list your repositories.</span>
                </div>
              </div>
            ) : reposError ? (
              <div className="text-xs text-red-500 h-9 border border-red-500/20 rounded-md px-3 flex items-center bg-red-500/5">
                Error loading repositories. Check your connection or refresh the page.
              </div>
            ) : (
              <div className="flex gap-2">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="flex-grow justify-between text-xs h-8 px-3 font-normal max-w-[400px] bg-background border border-input"
                    >
                      <span className="truncate">
                        {selectedRepo
                          ? availableRepos.find((repo) => repo.fullName === selectedRepo)?.fullName || selectedRepo
                          : "Select a repository..."}
                      </span>
                      <ChevronDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search repository..." className="h-8 text-xs" />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">No repository found.</CommandEmpty>
                        <CommandGroup>
                          {availableRepos.map((repo) => (
                            <CommandItem
                              key={repo.id}
                              value={repo.fullName}
                              onSelect={() => {
                                setSelectedRepo(repo.fullName);
                                setPopoverOpen(false);
                              }}
                              className="text-xs cursor-pointer"
                            >
                              <span className="truncate flex-grow text-left">
                                {repo.fullName} {repo.private ? "(Private)" : ""}
                              </span>
                              <Check
                                className={cn(
                                  "ml-2 size-3.5 shrink-0",
                                  selectedRepo === repo.fullName ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs px-3"
                  onClick={handleConnect}
                  disabled={!selectedRepo || connecting}
                >
                  {connecting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  Link Repo
                </Button>
              </div>
            )}
          </div>

          {/* Connected Repos list */}
          {gitRepos.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">
                Connected Repositories
              </label>
              <div className="rounded-lg border divide-y bg-muted/5">
                {gitRepos.map((repo) => (
                  <div key={repo._id} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <GitBranch className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{repo.repoName}</span>
                      <a
                        href={`https://github.com/${repo.repoName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/5"
                      onClick={() => handleDisconnect(repo.repoName)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhook Endpoint and copy */}
          <div className="flex flex-col gap-2 border-t pt-4">
            <label className="text-xs font-medium text-muted-foreground">
              Webhook Endpoint URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 rounded-md border bg-muted/50 px-3 py-1.5 text-xs select-all focus:outline-none text-muted-foreground"
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

          {/* Configuration Instructions */}
          <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground">
            <div className="flex gap-2 font-medium text-foreground mb-2">
              <Info className="size-4 shrink-0 text-sky-500" />
              Webhook Setup Instructions
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

          {/* Rules / descriptions */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-foreground">How it works</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3 bg-muted/5">
                <span className="text-xs font-medium text-foreground block mb-1">
                  1. Branching & PRs
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Include your issue identifier (e.g., <code className="bg-muted px-1 rounded font-mono">ENG-12</code>) in your branch name or PR title. When the PR is opened, OpenGrove will auto-transition the issue to <strong>In Progress</strong> and add a link to the PR.
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/5">
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

      {/* Slack Webhook Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/5 ring-1 ring-foreground/10">
            <MessageSquare className="size-6 text-foreground" />
          </div>
          <div className="flex flex-col gap-0.5">
            <CardTitle>Slack Notifications</CardTitle>
            <CardDescription>
              Post notifications to a Slack channel when issues are created or status is changed to done or canceled.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">
              Slack Incoming Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs px-3"
                onClick={handleSaveSlack}
                disabled={savingSlack}
              >
                {savingSlack ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Save Webhook"
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              To obtain a URL, go to your Slack Workspace settings, create a Slack App with &quot;Incoming Webhooks&quot; enabled, and add a webhook to your target channel.
            </p>
          </div>

          {slackWebhook && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <label className="text-xs font-medium text-foreground">
                Testing Utility
              </label>
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/5">
                <span className="text-[11px] text-muted-foreground">
                  Send a sample notification message to verify your connection works.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-[11px] px-2.5"
                  onClick={handleTestSlack}
                  disabled={testingSlack}
                >
                  {testingSlack ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Send className="size-3" />
                  )}
                  Send Test Message
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
