import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="relative overflow-hidden border-t">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_80%_at_50%_100%,color-mix(in_oklch,var(--foreground),transparent_93%),transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px)] bg-[size:56px_100%] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_100%,black,transparent)]"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center md:py-32">
        <h2 className="max-w-2xl text-4xl font-semibold tracking-tighter text-balance md:text-5xl">
          Stop syncing your tracker by hand. Start shipping.
        </h2>
        <p className="mt-5 max-w-md text-base text-balance text-muted-foreground">
          Connect your repos, create your first team, and let OpenGrove keep
          issues, PRs, commits, cycles, and agent activity in one fast workspace.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" className="h-10 px-5" asChild>
            <Link href="/sign-up">
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" className="h-10 px-5" asChild>
            <Link href="/sign-up">Connect GitHub</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
