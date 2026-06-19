import { Crosshair, FileText, MessagesSquare, Workflow } from "lucide-react";
import { FeatureBullet } from "@/components/marketing/feature-bullet";
import { MockAiChat } from "@/components/marketing/mock-ai-chat";
import { Section, SectionHeading } from "@/components/marketing/section";

export function FeaturesAi() {
  return (
    <Section id="ai" className="overflow-hidden">
      {/* A single restrained glow distinguishes the AI section. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_50%_40%_at_70%_20%,color-mix(in_oklch,var(--foreground),transparent_95%),transparent)]"
      />
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <MockAiChat className="order-last lg:order-first" />
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Included in Pro & Enterprise
          </div>
          <SectionHeading
            eyebrow="04 · The Org Brain"
            title="Built for non-human identities"
            lede="OpenGrove isn't just an issue tracker—it's an orchestration layer built for infinite parallelism. Agents read your issues, cycles, and skills with scoped permissions, allowing hundreds of autonomous workflows to run concurrently without stepping on each other's toes."
          />
          <div className="mt-10 grid gap-7 sm:grid-cols-2">
            <FeatureBullet
              icon={MessagesSquare}
              title="Ask about the repo"
              description="“What changed in open-grove this week?” gets answered from PRs, commits, and linked issues."
            />
            <FeatureBullet
              icon={FileText}
              title="Cycle reports on demand"
              description="Generate standups and cycle summaries from real activity, not scattered Slack memory."
            />
            <FeatureBullet
              icon={Crosshair}
              title="Find work that slipped"
              description="The agent surfaces PRs and commits that were never connected to an issue."
            />
            <FeatureBullet
              icon={Workflow}
              title="Create next actions"
              description="Turn blockers, TODOs, and review notes into issues without leaving the flow."
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
