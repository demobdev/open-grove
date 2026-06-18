import {
  GitBranch,
  Inbox,
  History,
  Shield,
  ListFilter,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Search,
    title: "Full-text search",
    description:
      "Find any issue by title or description in milliseconds, scoped to your workspace.",
  },
  {
    icon: ListFilter,
    title: "Saved views",
    description:
      "Slice the backlog by status, assignee, label, or cycle — then save the view for the team.",
  },
  {
    icon: GitBranch,
    title: "Repo mapping",
    description:
      "Connect multiple repositories to a team or project and keep work scoped to the right codebase.",
  },
  {
    icon: Inbox,
    title: "AI Suggestions Inbox",
    description:
      "Review uncertain matches, duplicate warnings, and follow-up tasks before they touch the board.",
  },
  {
    icon: History,
    title: "Activity timeline",
    description:
      "Every issue shows status changes, comments, PRs, commits, and agent actions in one history.",
  },
  {
    icon: Shield,
    title: "Org-scoped permissions",
    description:
      "Agents and automations only act inside the teams, repos, and workspaces they’re allowed to access.",
  },
];

export function FeatureGrid() {
  return (
    <Section>
      <SectionHeading
        eyebrow="06 · Everything else"
        title="All the table stakes, none of the bloat"
        lede="The features you expect from a serious tracker — built in, fast, and out of your way."
        align="center"
      />
      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="group bg-background p-6 transition-colors hover:bg-muted/40"
          >
            <span className="flex size-8 items-center justify-center rounded-md border bg-muted/50 transition-colors group-hover:border-ring/50">
              <Icon className="size-4 text-foreground/80" />
            </span>
            <h3 className="mt-4 text-sm font-medium">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
