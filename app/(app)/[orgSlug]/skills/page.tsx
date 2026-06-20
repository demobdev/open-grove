"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Brain } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiAccess } from "@/components/ai/use-ai-access";
import { CreateSkillDialog } from "@/components/skills/create-skill-dialog";

export default function SkillsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const skills = useQuery(api.skills.listSkills);
  const aiAccess = useAiAccess();

  if (!aiAccess.hasAccess) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6 border border-border shadow-sm">
          <Brain className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Skills Registry</h2>
        <p className="text-muted-foreground max-w-[500px] mb-8 leading-relaxed">
          The Org Brain requires a Pro or Enterprise plan. Upgrade to define custom organizational rules, quality gates, and automated workflows.
        </p>
        <Button asChild size="lg" className="shadow-md transition-all hover:scale-105 active:scale-95">
          <a href={`/${orgSlug}/settings`}>Upgrade Plan</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Skills Registry
            </h1>
            <p className="text-muted-foreground mt-2">
              The Org Brain. Define prompts, quality gates, and automated workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="shadow-sm" 
              onClick={() => router.push(`/${orgSlug}/skills/library`)}
            >
              Browse Library
            </Button>
            <CreateSkillDialog />
          </div>
        </div>

        {skills === undefined ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border/50">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No skills defined</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first skill to teach the agent about your organization&apos;s specific requirements.
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="transition-all hover:bg-muted/80"
                onClick={() => router.push(`/${orgSlug}/skills/library`)}
              >
                Browse Library
              </Button>
              <CreateSkillDialog>
                <Button className="transition-all shadow-sm">
                  Create your first skill
                </Button>
              </CreateSkillDialog>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <Card 
                key={skill._id} 
                className="group flex flex-col overflow-hidden transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl transition-colors group-hover:text-primary">
                        {skill.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {skill.slug}
                      </CardDescription>
                    </div>
                    <Badge variant={skill.isEnabled ? "default" : "secondary"} className="shadow-sm">
                      {skill.isEnabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {skill.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 px-6 py-4 flex items-center justify-between">
                  <Badge variant="outline" className="capitalize font-medium">
                    {skill.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    v{skill.version}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
