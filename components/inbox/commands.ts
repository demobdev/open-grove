import { Bell, Settings } from "lucide-react";
import { AppCommand } from "@/components/commands/registry";

export const inboxCommands: AppCommand[] = [
  {
    id: "open-inbox",
    label: "Open Inbox",
    group: "Navigation",
    icon: Bell,
    shortcut: "i",
    run: ({ push, orgSlug }) => push(`/${orgSlug}/inbox`),
  },
  {
    id: "go-integrations-settings",
    label: "Go to integrations settings",
    group: "Navigation",
    icon: Settings,
    run: ({ push, orgSlug }) => push(`/${orgSlug}/settings/integrations`),
  },
];
