"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { Brain, ArrowLeft, Download, CheckCircle2, ChevronRight } from "lucide-react";
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
import { useAiAccess } from "@/components/ai/use-ai-access";
import { SUPERPOWER_SKILLS, LibrarySkill } from "@/lib/skill-library";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

export default function SkillLibraryPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const aiAccess = useAiAccess();
  
  const existingSkills = useQuery(api.skills.listSkills);
  const createSkill = useMutation(api.skills.createSkill);
  
  const [installing, setInstalling] = useState<string | null>(null);

  if (!aiAccess.hasAccess) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6 border border-border shadow-sm">
          <Brain className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Skill Library</h2>
        <p className="text-muted-foreground max-w-[500px] mb-8 leading-relaxed">
          The Skill Library requires a Pro or Enterprise plan. Upgrade to access pre-built Superpower skills.
        </p>
        <Button asChild size="lg" className="shadow-md transition-all hover:scale-105 active:scale-95">
          <a href={`/${orgSlug}/settings`}>Upgrade Plan</a>
        </Button>
      </div>
    );
  }

  const handleInstall = async (skill: LibrarySkill) => {
    try {
      setInstalling(skill.slug);
      await createSkill({
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        type: skill.type,
        scope: {},
        content: skill.content,
        priority: 0,
        isEnabled: true,
      });
      toast.success(`${skill.name} installed successfully!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to install skill");
    } finally {
      setInstalling(null);
    }
  };

  const isInstalled = (slug: string) => {
    return existingSkills?.some(s => s.slug === slug);
  };

  return (
    <div className="flex-1 overflow-auto p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full">
            <Link href={`/${orgSlug}/skills`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                Superpower Library
              </h1>
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                Curated
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              1-click install high-quality, pre-engineered skills to supercharge your workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUPERPOWER_SKILLS.map((skill) => {
            const installed = isInstalled(skill.slug);
            const isCurrentlyInstalling = installing === skill.slug;

            return (
              <Card 
                key={skill.slug} 
                className="group flex flex-col overflow-hidden transition-all border-primary/10 bg-gradient-to-br from-background to-muted/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
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
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {skill.description}
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
                  <Badge variant="outline" className="capitalize font-medium bg-background">
                    {skill.type}
                  </Badge>
                  
                  <Button 
                    size="sm" 
                    variant={installed ? "secondary" : "default"}
                    className="gap-1.5 transition-all"
                    disabled={installed || isCurrentlyInstalling}
                    onClick={() => handleInstall(skill)}
                  >
                    {isCurrentlyInstalling ? (
                      <span className="flex items-center gap-1.5">
                        <div className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Installing...
                      </span>
                    ) : installed ? (
                      <span className="flex items-center gap-1.5 text-emerald-500">
                        <CheckCircle2 className="size-3.5" />
                        Installed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Download className="size-3.5" />
                        Install
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
