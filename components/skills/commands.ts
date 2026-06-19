import { Brain } from "lucide-react";
import { AppCommand } from "@/components/commands/registry";

export const skillsCommands: AppCommand[] = [
  {
    id: "go-skills",
    label: "Go to Skills Registry",
    group: "Workspace Settings",
    icon: Brain,
    run: ({ push, orgSlug }) => push(`/${orgSlug}/skills`),
  },
];
