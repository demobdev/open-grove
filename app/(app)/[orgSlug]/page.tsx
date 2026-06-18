"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery, useAction } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Sparkles,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FolderSync,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GitHubRepo {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
}

export default function WorkspaceHomePage() {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const teams = useQuery(api.teams.list);
  const { has } = useAuth();
  const clerk = useClerk();
  const isAdmin = has?.({ role: "org:admin" }) ?? false;

  const fetchUserRepos = useAction(api.githubConnection.listUserRepositories);
  const fetchGithubIssuesAndMilestones = useAction(api.githubConnection.fetchGithubIssuesAndMilestones);
  const initializeWorkspace = useMutation(api.githubConnection.initializeWorkspace);
  const seedDemoData = useMutation(api.seed.demoData);

  const [seeding, setSeeding] = useState(false);

  // Onboarding Wizard State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [teamName, setTeamName] = useState("Engineering");
  const [teamKey, setTeamKey] = useState("ENG");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [importing, setImporting] = useState(false);

  interface ImportIssue {
    title: string;
    body?: string;
    milestoneId: number | null;
  }

  interface ImportMilestone {
    id: number;
    title: string;
    description?: string;
  }

  const [issuesToImport, setIssuesToImport] = useState<ImportIssue[]>([]);
  const [milestonesToImport, setMilestonesToImport] = useState<ImportMilestone[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  const loadRepos = async () => {
    setLoadingRepos(true);
    setReposError(null);
    try {
      const res = await fetchUserRepos();
      if (res.success && res.repos) {
        setGithubRepos(res.repos);
      } else if (res.error) {
        setReposError(res.error);
      }
    } catch (err) {
      console.error(err);
      setReposError("failed_to_fetch");
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (teams && teams.length > 0) {
      router.replace(`/${params.orgSlug}/team/${teams[0]._id}`);
    }
  }, [teams, router, params.orgSlug]);

  useEffect(() => {
    if (step === 2 && githubRepos.length === 0 && !loadingRepos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleProceedToStep3 = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository first");
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await fetchGithubIssuesAndMilestones({ repoName: selectedRepo });
      if (res.success && res.issues && res.milestones) {
        setIssuesToImport(res.issues);
        setMilestonesToImport(res.milestones);
        setStep(3);
      } else {
        toast.error(res.error || "Failed to load repository data");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching repository preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleInitialize = async (importFromGithub: boolean) => {
    setImporting(true);
    try {
      const result = await initializeWorkspace({
        teamName,
        teamKey,
        repoName: importFromGithub ? selectedRepo : undefined,
        milestones: importFromGithub ? milestonesToImport.map(m => ({ id: m.id, title: m.title, description: m.description })) : [],
        issues: importFromGithub ? issuesToImport.map(i => ({ title: i.title, body: i.body, milestoneId: i.milestoneId })) : [],
      });
      toast.success(
        importFromGithub 
          ? `Workspace ready! Created team ${teamKey} and imported ${issuesToImport.length} issues.`
          : `Workspace ready! Created team ${teamKey}.`
      );
      router.replace(`/${params.orgSlug}/team/${result.teamId}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to initialize workspace");
    } finally {
      setImporting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoData({});
      toast.success(
        `Demo workspace ready — ${result.teams} teams, ${result.issues} issues, ${result.projects} projects.`
      );
    } catch (error) {
      setSeeding(false);
      toast.error(
        error instanceof Error ? error.message : "Seeding demo data failed."
      );
    }
  };

  if (teams === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-xl space-y-6">
          
          {/* Header Progress Indicators */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className={cn(
              "font-medium px-2 py-1 rounded",
              step === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}>
              1. Team Setup
            </span>
            <ArrowRight className="size-3 text-muted-foreground/60" />
            <span className={cn(
              "font-medium px-2 py-1 rounded",
              step === 2 ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}>
              2. Link GitHub
            </span>
            <ArrowRight className="size-3 text-muted-foreground/60" />
            <span className={cn(
              "font-medium px-2 py-1 rounded",
              step === 3 ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}>
              3. Import
            </span>
          </div>

          <Card className="border border-border bg-card shadow-lg">
            
            {/* Step 1: Team Config */}
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="size-5 text-indigo-400" />
                    Configure your first team
                  </CardTitle>
                  <CardDescription>
                    Teams help group issues, cycles, and projects. Let&apos;s create your first team profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Team Name</label>
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Engineering, Product, Marketing..."
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      Team Identifier Prefix
                      <span className="text-[10px] text-muted-foreground font-normal">Used as prefix for issues (e.g. ENG-12)</span>
                    </label>
                    <Input
                      value={teamKey}
                      onChange={(e) => setTeamKey(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="ENG"
                      className="text-xs font-mono"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!teamName.trim()) {
                        toast.error("Please enter a team name");
                        return;
                      }
                      if (!teamKey.trim()) {
                        toast.error("Please enter a team key prefix");
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full text-xs mt-2"
                  >
                    Continue
                    <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </CardContent>
              </>
            )}

            {/* Step 2: Link Repo */}
            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <GitBranch className="size-5 text-sky-400" />
                    Link GitHub Repository
                  </CardTitle>
                  <CardDescription>
                    Connect a repository to auto-sync branches, pull requests, and import issues directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingRepos ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                      Fetching your repositories...
                    </div>
                  ) : reposError === "not_linked" ? (
                    <div className="rounded-lg border border-dashed p-4 bg-muted/10 space-y-3">
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="size-4 shrink-0 text-amber-500" />
                        <p>
                          Your GitHub profile is not linked to your account. Click the button below to open your profile settings and connect GitHub under <strong>Social accounts</strong>.
                        </p>
                      </div>
                      <Button onClick={() => clerk.openUserProfile()} className="w-full text-xs h-9 gap-1.5">
                        <GitBranch className="size-3.5" />
                        Connect GitHub Account
                      </Button>
                      <Button onClick={loadRepos} variant="outline" className="w-full text-xs h-8">
                        Refresh Repositories list
                      </Button>
                    </div>
                  ) : reposError ? (
                    <div className="text-xs text-red-500 rounded border border-red-500/20 p-3 bg-red-500/5 flex gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      Failed to fetch repositories. Please try again.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground">Select Repository</label>
                        <select
                          value={selectedRepo}
                          onChange={(e) => setSelectedRepo(e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Choose a repository...</option>
                          {githubRepos.map((repo) => (
                            <option key={repo.id} value={repo.fullName}>
                              {repo.fullName} {repo.private ? "(Private)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setStep(1)}
                          className="text-xs flex-1 border border-border"
                        >
                          <ArrowLeft className="size-3.5 mr-1" />
                          Back
                        </Button>
                        <Button
                          onClick={handleProceedToStep3}
                          disabled={!selectedRepo || loadingPreview}
                          className="text-xs flex-1"
                        >
                          {loadingPreview ? (
                            <Loader2 className="size-3.5 animate-spin mr-1" />
                          ) : null}
                          Continue
                          <ArrowRight className="size-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Or</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleInitialize(false)}
                    disabled={importing}
                    className="w-full text-xs border-dashed text-muted-foreground hover:text-foreground"
                  >
                    {importing ? (
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="size-3.5 mr-1 text-indigo-400" />
                    )}
                    Skip GitHub connection and start empty
                  </Button>
                </CardContent>
              </>
            )}

            {/* Step 3: Confirm Import */}
            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FolderSync className="size-5 text-green-400" />
                    Confirm Issue Import
                  </CardTitle>
                  <CardDescription>
                    Ready to populate your workspace with data from <strong>{selectedRepo}</strong>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Preview Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3 bg-muted/20 text-center">
                      <span className="text-2xl font-bold text-foreground">{issuesToImport.length}</span>
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider mt-1">Open Issues</span>
                    </div>
                    <div className="rounded-lg border p-3 bg-muted/20 text-center">
                      <span className="text-2xl font-bold text-foreground">{milestonesToImport.length}</span>
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider mt-1">Projects</span>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-sky-500/5 border-sky-500/10 p-3 text-xs text-muted-foreground flex gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-sky-500" />
                    <span>
                      Open issues will import as <strong>Todo</strong> tasks, and milestones will automatically map to active <strong>Projects</strong>.
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setStep(2)}
                      disabled={importing}
                      className="text-xs flex-1 border border-border"
                    >
                      <ArrowLeft className="size-3.5 mr-1" />
                      Back
                    </Button>
                    <Button
                      onClick={() => handleInitialize(true)}
                      disabled={importing}
                      className="text-xs flex-1"
                    >
                      {importing ? (
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                      ) : null}
                      Start Importing
                      <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Seed Nudge footer */}
          {isAdmin && step === 1 && (
            <div className="text-center space-y-1">
              <span className="text-xs text-muted-foreground">Looking to try things out?</span>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="text-xs font-semibold text-primary hover:underline ml-1 cursor-pointer disabled:opacity-50"
              >
                {seeding ? "Seeding workspace..." : "Seed sample demo data"}
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}
