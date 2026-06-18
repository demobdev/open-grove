import {
  ArrowRight,
  Bot,
  LayoutGrid,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Kbd } from "@/components/marketing/kbd";
import { cn } from "@/lib/utils";

/** Command palette (⌘K) mock for the keyboard-first section. */
export function MockCommandPalette({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-popover shadow-2xl shadow-black/20 dark:shadow-black/60",
        className
      )}
    >
      <div className="flex h-11 items-center gap-2.5 border-b px-3.5">
        <Search className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          github
          <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground" />
        </span>
        <Kbd className="ml-auto">esc</Kbd>
      </div>
      <div className="p-1.5 text-sm">
        <p className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
          GitHub · open-grove
        </p>
        <PaletteRow
          icon={<Search className="size-4" />}
          label="Show unlinked PRs"
          kbd="U"
          active
        />
        <PaletteRow
          icon={<RefreshCcw className="size-4" />}
          label="Switch repository…"
          kbd="R"
        />
        <p className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
          Workspace
        </p>
        <PaletteRow
          icon={<Plus className="size-4" />}
          label="Create issue from PR #218"
          kbd="C"
        />
        <PaletteRow
          icon={<Bot className="size-4" />}
          label="Summarize what shipped…"
          kbd="⌘J"
        />
        <PaletteRow
          icon={<LayoutGrid className="size-4" />}
          label="Open board"
          kbd="B"
        />
      </div>
      <div className="flex h-9 items-center gap-2 border-t bg-muted/30 px-3.5 text-[11px] text-muted-foreground">
        <ArrowRight className="size-3" />
        Select
        <span className="ml-auto flex items-center gap-1.5">
          Navigate <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </span>
      </div>
    </div>
  );
}

function PaletteRow({
  icon,
  label,
  kbd,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  kbd?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-foreground/90",
        active && "bg-accent text-accent-foreground"
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
      {kbd ? <Kbd className="ml-auto">{kbd}</Kbd> : null}
    </div>
  );
}
