"use client";

import { ArrowUp } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export function AiComposer({
  disabled,
  disabledReason,
  onSend,
}: {
  disabled: boolean;
  disabledReason?: string;
  onSend: (prompt: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Slash commands
  const skills = useQuery(api.skills.listSkills);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeSkills = skills?.filter((s) => s.isEnabled) || [];
  const filteredSkills = slashQuery !== null
    ? activeSkills.filter(
        (s) =>
          s.slug.toLowerCase().includes(slashQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(slashQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (slashQuery !== null) {
      setSelectedIndex(0);
    }
  }, [slashQuery]);

  const submit = async () => {
    const prompt = text.trim();
    if (!prompt || disabled || sending) {
      return;
    }
    setSending(true);
    setText("");
    try {
      await onSend(prompt);
    } catch {
      // Caller surfaces the error; restore the draft so nothing is lost.
      setText(prompt);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.target.value;
    setText(val);

    // Naive slash detection: if the text starts with "/" or has " /" 
    const match = /(?:^|\s)\/([a-zA-Z0-9_-]*)$/.exec(val);
    if (match) {
      setSlashQuery(match[1]);
    } else {
      setSlashQuery(null);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashQuery !== null && filteredSkills.length > 0) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : filteredSkills.length - 1));
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((i) => (i < filteredSkills.length - 1 ? i + 1 : 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const selected = filteredSkills[selectedIndex];
        // Replace the "/query" part with the loop's prompt
        const match = /(?:^|\s)\/([a-zA-Z0-9_-]*)$/.exec(text);
        if (match) {
          const prefix = text.slice(0, match.index);
          const space = match.index > 0 ? " " : "";
          // Provide the prompt
          setText(prefix + space + selected.content + " ");
        }
        setSlashQuery(null);
        return;
      }
      if (event.key === "Escape") {
        setSlashQuery(null);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="border-t p-4 relative">
      <form
        onSubmit={onSubmit}
        className="relative mx-auto flex w-full max-w-2xl items-end gap-2 rounded-lg border bg-background p-2 focus-within:ring-1 focus-within:ring-ring"
      >
        {slashQuery !== null && filteredSkills.length > 0 && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 w-full max-w-sm rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden z-50 animate-in fade-in zoom-in-95">
            <div className="max-h-[300px] overflow-y-auto p-1">
              {filteredSkills.map((skill, i) => (
                <div
                  key={skill._id}
                  className={cn(
                    "flex flex-col cursor-default select-none rounded-sm px-3 py-2 text-sm outline-none transition-colors",
                    i === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => {
                    const match = /(?:^|\s)\/([a-zA-Z0-9_-]*)$/.exec(text);
                    if (match) {
                      const prefix = text.slice(0, match.index);
                      const space = match.index > 0 ? " " : "";
                      setText(prefix + space + skill.content + " ");
                    }
                    setSlashQuery(null);
                    textareaRef.current?.focus();
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="font-medium">/{skill.slug}</div>
                  <div className="text-xs text-muted-foreground truncate">{skill.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={
            disabled
              ? (disabledReason ?? "AI is unavailable")
              : "Ask OpenGrove to create, find or report on issues…"
          }
          disabled={disabled || sending}
          rows={1}
          className="max-h-40 min-h-9 flex-1 resize-none border-none bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          className="size-7 shrink-0"
          disabled={disabled || sending || !text.trim()}
        >
          <ArrowUp className="size-4" />
        </Button>
      </form>
      <p className="mx-auto mt-1.5 max-w-2xl px-1 text-[10px] text-muted-foreground">
        OpenGrove can create and edit issues in your workspace. Enter to send,
        Shift+Enter for a new line.
      </p>
    </div>
  );
}
