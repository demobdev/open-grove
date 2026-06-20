"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Repeat } from "lucide-react";

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

export function CreateLoopDialog({
  children,
  initialActionSkillId = "",
  initialName = "",
  initialDescription = "",
}: {
  children?: React.ReactNode;
  initialActionSkillId?: string;
  initialName?: string;
  initialDescription?: string;
}) {
  const [open, setOpen] = useState(false);
  const createLoop = useMutation(api.loops.createLoop);
  const skills = useQuery(api.skills.listSkills);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [actionSkillId, setActionSkillId] = useState<string>(initialActionSkillId);
  const [validationSkillId, setValidationSkillId] = useState<string>("");
  const [maxIterations, setMaxIterations] = useState<string>("5");
  const [isEnabled, setIsEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a name");
    if (!actionSkillId) return toast.error("Please select an action skill");
    if (!validationSkillId) return toast.error("Please select a validation skill");

    setLoading(true);
    try {
      await createLoop({
        name,
        description,
        actionSkillId: actionSkillId as Id<"skills">,
        validationSkillId: validationSkillId as Id<"skills">,
        maxIterations: parseInt(maxIterations, 10),
        isEnabled,
      });
      toast.success("Loop created successfully!");
      setOpen(false);
      setName("");
      setDescription("");
      setActionSkillId("");
      setValidationSkillId("");
      setMaxIterations("5");
      setIsEnabled(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create loop");
    } finally {
      setLoading(false);
    }
  };

  const activeSkills = skills?.filter(s => s.isEnabled) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Loop
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="size-5 text-indigo-500" />
              Create Agentic Feedback Loop
            </DialogTitle>
            <DialogDescription>
              Define a task for an agent to run iteratively until a validation goal is met.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sub-50ms Page Load Loop"
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
              <Label>Action Skill (The Work)</Label>
              <Select value={actionSkillId} onValueChange={setActionSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an active skill" />
                </SelectTrigger>
                <SelectContent>
                  {activeSkills.length === 0 ? (
                    <SelectItem value="none" disabled>No active skills found</SelectItem>
                  ) : (
                    activeSkills.map(skill => (
                      <SelectItem key={skill._id} value={skill._id}>
                        {skill.name} ({skill.slug})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Validation Skill (The Goal)</Label>
              <Select value={validationSkillId} onValueChange={setValidationSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an active skill to test against" />
                </SelectTrigger>
                <SelectContent>
                  {activeSkills.length === 0 ? (
                    <SelectItem value="none" disabled>No active skills found</SelectItem>
                  ) : (
                    activeSkills.map(skill => (
                      <SelectItem key={skill._id} value={skill._id}>
                        {skill.name} ({skill.slug})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxIterations">Max Iterations</Label>
              <Input
                id="maxIterations"
                type="number"
                min="1"
                max="20"
                value={maxIterations}
                onChange={(e) => setMaxIterations(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times the agent will retry if the validation skill fails.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Enable Loop</Label>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !actionSkillId || !validationSkillId || activeSkills.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
