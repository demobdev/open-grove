"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export function CreateSkillDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createSkill = useMutation(api.skills.createSkill);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "custom" as "triage" | "review" | "docs" | "security" | "style" | "release" | "custom",
    content: "",
    priority: 10,
    isEnabled: true,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSkill({
        ...formData,
        scope: {}, // Global scope for now
      });
      toast.success("Skill created");
      setOpen(false);
      setFormData({
        name: "",
        slug: "",
        description: "",
        type: "custom",
        content: "",
        priority: 10,
        isEnabled: true,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create skill");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="shadow-sm transition-all hover:shadow-md active:scale-95 group">
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            New Skill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Skill</DialogTitle>
          <DialogDescription>
            Teach the agent a new organizational rule or procedure.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                required
                placeholder="e.g. Next.js App Router Rules" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input 
                id="slug"
                required
                pattern="^[a-z0-9-]+$"
                title="Lowercase letters, numbers, and hyphens only"
                placeholder="nextjs-app-router" 
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description"
              placeholder="Brief explanation of what this skill does" 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Skill Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: "triage" | "review" | "docs" | "security" | "style" | "release" | "custom") => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">Code Review</SelectItem>
                  <SelectItem value="triage">Issue Triage</SelectItem>
                  <SelectItem value="docs">Documentation</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="style">Code Style</SelectItem>
                  <SelectItem value="release">Release</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input 
                id="priority"
                type="number" 
                required
                min={0}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
              <p className="text-[0.8rem] text-muted-foreground">Higher number = higher precedence</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Prompt Template</Label>
            <Textarea 
              id="content"
              required
              placeholder="Enter the instructions the agent should follow..." 
              className="min-h-[150px] font-mono text-sm"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <p className="text-[0.8rem] text-muted-foreground">
              The instructions that will be injected into the agent&apos;s context.
            </p>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Active</Label>
              <p className="text-[0.8rem] text-muted-foreground">
                Enable this skill for agent runs immediately
              </p>
            </div>
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
