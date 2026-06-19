import { ShieldCheck, Lock, Activity, CheckCircle2 } from "lucide-react";
import { FeatureBullet } from "@/components/marketing/feature-bullet";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FeaturesSecurity() {
  return (
    <Section id="security" className="overflow-hidden bg-muted/30">
      {/* Subtle security-themed glow */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,color-mix(in_oklch,var(--primary),transparent_95%),transparent)]"
      />
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground bg-background">
            <span className="size-1.5 rounded-full bg-blue-500" />
            Enterprise-Grade Trust
          </div>
          <SectionHeading
            eyebrow="05 · Agentic Security Runtime"
            title="Safe execution, by default"
            lede="Infinite parallelism requires infinite trust. OpenGrove's architecture acts as a strict security runtime. Agents don't have raw database access—they interact entirely through typed mutations, leaving an immutable ledger of every action."
          />
          <div className="mt-10 grid gap-7 sm:grid-cols-2">
            <FeatureBullet
              icon={Activity}
              title="Immutable Execution Ledger"
              description="Every automation, loop, and step is logged. See exactly what your agents did and why."
            />
            <FeatureBullet
              icon={CheckCircle2}
              title="Human-in-the-loop Approvals"
              description="Run agents in 'Draft' mode to review their proposed changes before they execute."
            />
            <FeatureBullet
              icon={ShieldCheck}
              title="Mutation-Bound Sandbox"
              description="Agents cannot run arbitrary destructive code. Their capabilities are strictly defined."
            />
            <FeatureBullet
              icon={Lock}
              title="Scoped API Keys"
              description="Provide Cursor and Claude Code with hashed tokens restricted to specific repos and teams."
            />
          </div>
        </div>

        {/* Security / Ledger visualization mock */}
        <div className="relative order-last flex items-center justify-center lg:order-last">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-blue-500/30 to-primary/30 blur" />
            <Card className="relative flex flex-col gap-3 border-border/50 bg-background/95 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-blue-500" />
                  <span className="font-semibold tracking-tight">Execution Ledger</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  ID: agnt_8f92bd
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 size-2 rounded-full bg-emerald-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Verify API Key Scope</p>
                    <p className="text-xs text-muted-foreground font-mono">scopes: ["repo:read", "issues:write"]</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 size-2 rounded-full bg-emerald-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Load Active Skills</p>
                    <p className="text-xs text-muted-foreground font-mono">loaded 3 skills for team_id_123</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 size-2 rounded-full bg-amber-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Propose PR Review</p>
                    <p className="text-xs text-muted-foreground">Execution mode: Draft (Needs Approval)</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Section>
  );
}
