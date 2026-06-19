"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Command, GitBranch, Keyboard, Search, HelpCircle, Box, RefreshCcw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function HelpDialog() {
  const [open, setOpen] = useState(false);
  const params = useParams<{ orgSlug?: string }>();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
              <HelpCircle className="size-4.5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Help & Shortcuts</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[600px] gap-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="size-5" />
            Command Palette & Shortcuts
          </DialogTitle>
          <DialogDescription>
            OpenGrove is designed to be used entirely with your keyboard. 
            Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground text-[11px] mx-1">⌘K</kbd> 
            anywhere to open the command palette.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Keyboard className="size-4 text-muted-foreground" />
              Global Shortcuts
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Search everything</span>
                <div className="flex gap-1">
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">⌘</kbd>
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">K</kbd>
                </div>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Create new issue</span>
                <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">C</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Toggle theme</span>
                <div className="flex gap-1">
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">⇧</kbd>
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">D</kbd>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Box className="size-4 text-muted-foreground" />
              Navigation
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Go to Inbox</span>
                <div className="flex gap-1">
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">G</kbd>
                  <span className="text-muted-foreground text-xs">then</span>
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">I</kbd>
                </div>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Go to Projects</span>
                <div className="flex gap-1">
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">G</kbd>
                  <span className="text-muted-foreground text-xs">then</span>
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">P</kbd>
                </div>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Go to Active Cycle</span>
                <div className="flex gap-1">
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">G</kbd>
                  <span className="text-muted-foreground text-xs">then</span>
                  <kbd className="font-mono bg-muted/50 border px-1.5 rounded text-xs text-muted-foreground">C</kbd>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4 space-y-3 mt-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            Connect Your Workflow
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            OpenGrove acts as the orchestration layer for your team. You should link your GitHub repositories 
            so issues transition automatically when PRs are opened and merged.
          </p>
          {params.orgSlug && (
            <Button variant="outline" size="sm" className="mt-2 text-xs h-8" asChild>
              <a href={`/${params.orgSlug}/settings/integrations`} onClick={() => setOpen(false)}>
                Configure Integrations
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
