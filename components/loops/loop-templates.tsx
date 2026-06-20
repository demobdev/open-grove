"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { Download, Inbox, MessageSquareCode, Clock, Loader2, BookOpen, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateLoopDialog } from "./create-loop-dialog";

const ITEMS_PER_PAGE = 6;

export function LoopTemplates() {
  const skills = useQuery(api.skills.listSkills);
  const [currentPage, setCurrentPage] = useState(1);

  const templates = skills || [];
  const paginatedTemplates = templates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4 mt-12 border-t pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Loop Library</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Browse and install agentic loops imported from Forward Future to automate your workspace.
          </p>
        </div>
        {templates.length > ITEMS_PER_PAGE && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
              {currentPage} / {Math.ceil(templates.length / ITEMS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage * ITEMS_PER_PAGE >= templates.length}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skills === undefined ? (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8">
            Loading loops...
          </div>
        ) : paginatedTemplates.map((template) => {
          return (
            <Card key={template._id} className="flex flex-col border-border/50 transition-all hover:border-border hover:shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <BookOpen className="size-5 text-indigo-500" />
                  </div>
                  <CardTitle className="text-base line-clamp-1" title={template.name}>{template.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-sm leading-relaxed line-clamp-3" title={template.description}>
                  {template.description || "No description provided."}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <CreateLoopDialog 
                  initialActionSkillId={template._id}
                  initialName={template.name}
                  initialDescription={template.description}
                >
                  <Button 
                    variant="secondary" 
                    className="w-full gap-2 font-medium"
                  >
                    <Plus className="size-4 text-muted-foreground" />
                    Use as Loop Action
                  </Button>
                </CreateLoopDialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
