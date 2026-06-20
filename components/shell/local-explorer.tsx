"use client";

import { useEffect, useState } from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type FileNode = {
  name: string;
  isDirectory: boolean;
  path: string;
};

export function LocalExplorer({ basePath = "." }: { basePath?: string }) {
  const [items, setItems] = useState<FileNode[]>([]);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we are running inside Electron
    if (typeof window !== "undefined" && window.require) {
      try {
        const electron = window.require("electron");
        setIsElectron(true);
        electron.ipcRenderer.invoke("read-dir", basePath).then((res: FileNode[]) => {
          // sort directories first
          const sorted = res.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
          });
          setItems(sorted.filter(i => !i.name.startsWith('.') && i.name !== 'node_modules'));
        });
      } catch (err) {
        console.error("Not in electron or ipc failed", err);
      }
    }
  }, [basePath]);

  if (!isElectron) return null;

  return (
    <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
      {items.map((item) => (
        <FileTreeItem key={item.path} item={item} />
      ))}
    </div>
  );
}

function FileTreeItem({ item }: { item: FileNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!item.isDirectory) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 hover:bg-accent hover:text-foreground cursor-pointer rounded-md">
        <File className="size-3.5 opacity-70" />
        <span className="truncate">{item.name}</span>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-2 py-1 hover:bg-accent hover:text-foreground cursor-pointer rounded-md">
        {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Folder className="size-3.5 opacity-70" />
        <span className="truncate">{item.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4">
        {isOpen && <LocalExplorer basePath={item.path} />}
      </CollapsibleContent>
    </Collapsible>
  );
}
