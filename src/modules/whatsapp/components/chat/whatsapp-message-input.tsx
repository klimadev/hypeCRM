"use client";

import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Mic, Paperclip, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  disabled?: boolean;
  sending?: boolean;
  onSend: (text: string) => Promise<void>;
};

export function WhatsappMessageInput({ disabled, sending, onSend }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled || sending) return;
    const content = text;
    setText("");
    await onSend(content);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      className="flex items-center gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 items-center rounded-[calc(var(--radius-control)+4px)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-2 shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)] focus-within:border-[var(--border-focus)] focus-within:shadow-[var(--focus-ring)]">
        <input
          ref={inputRef}
          className="min-h-[20px] max-h-[100px] flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          placeholder="Digite uma mensagem..."
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {text.trim() ? (
        <Button
          type="submit"
          size="icon"
          disabled={disabled || sending || !text.trim()}
          className="h-10 w-10 rounded-full bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] hover:bg-[var(--brand-strong)] active:scale-[0.99]"
        >
          <Send className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          disabled={disabled}
          className="h-10 w-10 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </form>
  );
}
