"use client";

import { MembersManager } from "@/components/billing/members-manager";
import { PlanLimitListener } from "@/components/billing/upgrade-prompt";

/**
 * Members settings: list, invite (via Clerk), change roles, and remove
 * members — with plan seat caps surfaced inline.
 */
export default function MembersSettingsPage() {
  return (
    <>
      <MembersManager />
      <PlanLimitListener />
    </>
  );
}
