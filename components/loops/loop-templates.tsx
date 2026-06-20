"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Download, Inbox, MessageSquareCode, Clock, Loader2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    id: "auto-triage",
    name: "Auto-Triage",
    description: "Automatically analyzes new issues, applies the correct team tags, and assigns them to the appropriate developer.",
    icon: Inbox,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "pr-reviewer",
    name: "PR Code Reviewer",
    description: "Listens for GitHub PR webhooks, reads the code diff, checks against style guidelines, and posts a review comment.",
    icon: MessageSquareCode,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    id: "daily-standup",
    name: "Daily Standup Summarizer",
    description: "Runs on a schedule to gather completed and in-progress work over the last 24 hours, generating a team update.",
    icon: Clock,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  }
];

export function LoopTemplates() {
  const installTemplate = useMutation(api.agent.templates.installTemplate);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = async (templateId: string) => {
    setInstallingId(templateId);
    try {
      await installTemplate({ templateId });
      toast.success("Template installed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to install template");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="space-y-4 mt-12 border-t pt-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Popular Loop Templates</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Install pre-configured agentic loops to automate your workspace instantly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => {
          const isInstalling = installingId === template.id;
          return (
            <Card key={template.id} className="flex flex-col border-border/50 transition-all hover:border-border hover:shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${template.bg}`}>
                    <template.icon className={`size-5 ${template.color}`} />
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm leading-relaxed">
                  {template.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  className="w-full gap-2 font-medium"
                  disabled={!!installingId}
                  onClick={() => handleInstall(template.id)}
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 text-muted-foreground" />
                      Install Template
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
