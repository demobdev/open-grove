import { CheckCircle, GitPullRequest, Inbox, Search } from "lucide-react";
import { FeatureBullet } from "@/components/marketing/feature-bullet";
import { MockFrame, MockWindowBar } from "@/components/marketing/mock-window";
import { Section, SectionHeading } from "@/components/marketing/section";

function MockGithubCard() {
  return (
    <MockFrame className="flex h-full flex-col bg-background/50 min-h-[400px]">
      <MockWindowBar title="open-grove-web/pull/218" />
      <div className="flex flex-1 flex-col justify-center gap-6 p-6 md:p-12">
        <div className="rounded-xl border bg-card p-5 shadow-sm text-sm mx-auto w-full max-w-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-emerald-500/10 p-1.5 text-emerald-500">
              <GitPullRequest className="size-4" />
            </div>
            <div className="space-y-1">
              <div className="font-medium">PR #218 opened</div>
              <div className="font-mono text-xs text-muted-foreground">
                feat: add fuzzy repo selector to onboarding
              </div>
            </div>
          </div>

          <div className="my-4 border-t border-dashed" />

          <div className="space-y-3">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Matched to
            </div>
            <div className="flex items-center justify-between rounded border bg-muted/40 p-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-muted-foreground shrink-0">ENG-147</span>
                <span className="font-medium truncate">Add searchable repository picker</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-500 shrink-0 ml-2">
                <CheckCircle className="size-3" />
                <span className="font-mono text-[10px]">94%</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Done
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-3.5 text-muted-foreground" />
                Linked PR
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-3.5 text-muted-foreground" />
                Moved issue to In Progress
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-3.5 text-muted-foreground" />
                Posted activity comment
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

export function FeaturesGithub() {
  return (
    <Section id="github">
      <SectionHeading
        eyebrow="03 · GitHub Sync"
        title="Work links itself"
        lede="OpenGrove connects issues to pull requests and commits automatically. Use issue keys when you want. When someone forgets, semantic matching catches the work and keeps the tracker honest."
        align="center"
      />
      <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_24rem]">
        <MockGithubCard />
        <div className="grid gap-6 rounded-xl border bg-card/50 p-5 self-start">
          <FeatureBullet
            icon={GitPullRequest}
            title="Explicit when you have it"
            description="Branches, PRs, and commits with ENG-142 link instantly."
          />
          <FeatureBullet
            icon={Search}
            title="Semantic when you forget it"
            description="No issue key? OpenGrove compares the PR title, description, commits, and files changed against active issues."
          />
          <FeatureBullet
            icon={CheckCircle}
            title="Status without babysitting"
            description="PR opened, ready for review, or merged — OpenGrove moves the issue according to your team’s workflow."
          />
          <FeatureBullet
            icon={Inbox}
            title="Suggestions when unsure"
            description="Low-confidence matches go to Inbox for approval instead of making a mess."
          />
        </div>
      </div>
    </Section>
  );
}
