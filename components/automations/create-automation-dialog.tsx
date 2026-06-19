"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Zap } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function CreateAutomationDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const createAutomation = useMutation(api.automations.createAutomation);
  const skills = useQuery(api.skills.listSkills);
  const loops = useQuery(api.loops.listLoops);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<
    "manual" | "github_pr_opened" | "github_pr_merged" | "github_push" | "cron" | "issue_created" | "issue_status_changed"
  >("github_pr_opened");
  const [targetId, setTargetId] = useState<string>("");
  const [executionMode, setExecutionMode] = useState<
    "suggest_only" | "draft" | "auto_execute"
  >("suggest_only");
  const [isEnabled, setIsEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a name");
    if (!targetId) return toast.error("Please select a target skill or loop");

    setLoading(true);
    
    // Check if target is a loop or skill
    const isLoop = targetId.startsWith("loop_") || loops?.some(l => l._id === targetId);

    try {
      await createAutomation({
        name,
        description,
        triggerType,
        targetSkillId: isLoop ? undefined : (targetId as Id<"skills">),
        targetLoopId: isLoop ? (targetId as Id<"loops">) : undefined,
        executionMode,
        isEnabled,
      });
      toast.success("Automation created successfully!");
      setOpen(false);
      setName("");
      setDescription("");
      setTriggerType("github_pr_opened");
      setTargetId("");
      setExecutionMode("suggest_only");
      setIsEnabled(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create automation");
    } finally {
      setLoading(false);
    }
  };

  const activeSkills = skills?.filter(s => s.isEnabled) || [];
  const activeLoops = loops?.filter(l => l.isEnabled) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              Create Automation
            </DialogTitle>
            <DialogDescription>
              Map an event trigger to an agentic skill. &quot;If This, Then That&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PR Code Reviewer"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>IF Trigger Event</Label>
              <Select value={triggerType} onValueChange={(val) => setTriggerType(val as "manual" | "github_pr_opened" | "github_pr_merged" | "github_push" | "cron" | "issue_created" | "issue_status_changed")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github_pr_opened">GitHub PR Opened</SelectItem>
                  <SelectItem value="github_pr_merged">GitHub PR Merged</SelectItem>
                  <SelectItem value="github_push">GitHub Push (Commit)</SelectItem>
                  <SelectItem value="issue_created">Issue Created</SelectItem>
                  <SelectItem value="issue_status_changed">Issue Status Changed</SelectItem>
                  <SelectItem value="cron">Scheduled (Cron)</SelectItem>
                  <SelectItem value="manual">Manual Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>THEN Execute Target</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an active skill or loop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled className="font-semibold text-muted-foreground bg-muted/50">Skills</SelectItem>
                  {activeSkills.length === 0 ? (
                    <SelectItem value="no_skills" disabled className="pl-6">No active skills found</SelectItem>
                  ) : (
                    activeSkills.map(skill => (
                      <SelectItem key={skill._id} value={skill._id} className="pl-6">
                        {skill.name}
                      </SelectItem>
                    ))
                  )}
                  
                  <SelectItem value="none2" disabled className="font-semibold text-muted-foreground bg-muted/50 mt-2">Loops</SelectItem>
                  {activeLoops.length === 0 ? (
                    <SelectItem value="no_loops" disabled className="pl-6">No active loops found</SelectItem>
                  ) : (
                    activeLoops.map(loop => (
                      <SelectItem key={loop._id} value={loop._id} className="pl-6">
                        {loop.name} (Loop)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {activeSkills.length === 0 && activeLoops.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  You need to create an active skill or loop first.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Execution Mode</Label>
              <Select value={executionMode} onValueChange={(val) => setExecutionMode(val as "suggest_only" | "draft" | "auto_execute")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggest_only">Suggest Only (Post comment)</SelectItem>
                  <SelectItem value="draft">Draft (Requires approval)</SelectItem>
                  <SelectItem value="auto_execute">Auto Execute (Direct mutation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Enable Automation</Label>
                <p className="text-[10px] text-muted-foreground">
                  Whether this automation is currently active.
                </p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !targetId || (activeSkills.length === 0 && activeLoops.length === 0)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
