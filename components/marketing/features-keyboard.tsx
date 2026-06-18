import { MockCommandPalette } from "@/components/marketing/mock-command-palette";
import { Section, SectionHeading } from "@/components/marketing/section";

const COMMANDS = [
  "Create issue",
  "Connect GitHub repo",
  "Show unlinked PRs",
  "Switch repository",
  "Ask agent about this cycle",
  "Create issue from PR #218",
  "Approve suggested link",
  "Summarize what shipped",
];

export function FeaturesKeyboard() {
  return (
    <Section id="keyboard">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="05 · Command Center"
            title="One shortcut for everything"
            lede="OpenGrove’s command bar is more than navigation. Create issues, switch repos, approve AI suggestions, ask the agent, and move work across the system from one place."
          />
          <div className="mt-10 space-y-2.5">
            {COMMANDS.map((cmd) => (
              <div
                key={cmd}
                className="flex h-9 items-center justify-between rounded-lg border bg-card/50 px-3 text-sm"
              >
                <span className="text-foreground/90 font-mono text-xs">&gt; {cmd}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 scale-110 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,color-mix(in_oklch,var(--foreground),transparent_94%),transparent)]"
          />
          <MockCommandPalette className="mx-auto max-w-md" />
        </div>
      </div>
    </Section>
  );
}
