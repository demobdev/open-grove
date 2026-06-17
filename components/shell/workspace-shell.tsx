"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Loader2, Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { PlanLimitListener } from "@/components/billing/upgrade-prompt";
import { CommandProvider } from "@/components/commands/command-provider";
import { AppSidebar } from "./app-sidebar";

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

/**
 * Authenticated workspace shell.
 *
 * 1. Makes sure the Clerk active org matches the org slug in the URL.
 * 2. Waits for the Clerk → Convex webhook sync (user + org docs) before
 *    rendering, so org-scoped queries never throw during onboarding.
 */
export function WorkspaceShell({
  orgSlug,
  children,
}: {
  orgSlug: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [pathname]);

  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const targetMembership = userMemberships.data?.find(
    (m) => m.organization.slug === orgSlug
  );
  const needsSwitch = isLoaded && targetMembership !== undefined;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (targetMembership) {
      void setActive({ organization: targetMembership.organization.id });
    } else if (!userMemberships.isLoading && !userMemberships.hasNextPage) {
      // The user doesn't belong to an org with this slug.
      router.replace("/onboarding");
    }
  }, [
    isLoaded,
    targetMembership,
    userMemberships.isLoading,
    userMemberships.hasNextPage,
    setActive,
    router,
  ]);

  const currentUser = useQuery(api.users.current);
  const currentOrg = useQuery(api.organizations.current);

  if (!isLoaded || (needsSwitch && currentOrg === undefined)) {
    return <FullScreenLoader label="Loading workspace…" />;
  }

  // Webhook sync still in flight — Convex queries are reactive, so this
  // resolves by itself within a second or two of first sign-up.
  if (currentUser === null || currentOrg === null) {
    return <FullScreenLoader label="Setting up your workspace…" />;
  }

  if (currentUser === undefined || currentOrg === undefined) {
    return <FullScreenLoader label="Loading workspace…" />;
  }

  if (currentOrg.slug !== orgSlug) {
    return <FullScreenLoader label="Switching organization…" />;
  }

  return (
    <CommandProvider>
      {/* Global upgrade prompt: catches free-plan limit errors toasted anywhere in the workspace. */}
      <PlanLimitListener />

      {/* Dynamic CSS override to indent page headers on mobile when sidebar toggle is active */}
      <style>{`
        @media (max-w: 767px) {
          main header {
            padding-left: 3.25rem !important;
          }
        }
      `}</style>

      {/* Floating Toggle Button for Mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-2 left-2.5 z-30 flex size-8 items-center justify-center rounded-md border bg-background/80 backdrop-blur-xs md:hidden shadow-sm hover:bg-accent cursor-pointer"
        aria-label="Open sidebar"
      >
        <Menu className="size-4" />
      </button>

      <div className="flex h-dvh overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:flex shrink-0">
          <AppSidebar />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 z-50 flex w-60 bg-sidebar shadow-xl md:hidden animate-in slide-in-from-left duration-200">
              <AppSidebar />
              {/* Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-md hover:bg-accent md:hidden text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="size-4" />
              </button>
            </div>
          </>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </CommandProvider>
  );
}
