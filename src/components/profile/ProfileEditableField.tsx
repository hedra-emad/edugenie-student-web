"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { ProfileUpdatePayload } from "@/types/profile.types";

interface Props {
  value: string;
  field: keyof ProfileUpdatePayload;
  placeholder?: string;
  /** className forwarded to the display text element */
  textClassName?: string;
  multiline?: boolean;
  onSave: (field: keyof ProfileUpdatePayload, value: string) => void;
}

export default function ProfileEditableField({
  value,
  field,
  placeholder = "Click to edit…",
  textClassName = "",
  multiline = false,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync draft when parent value changes (e.g. optimistic rollback)
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      textareaRef.current?.focus();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed === value) return;
    onSave(field, trimmed || value);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1500);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") cancel();
  }

  const isEmpty = !value || value.trim() === "";

  if (editing) {
    const sharedClass =
      "w-full border-b-2 border-[#3B1892] bg-transparent outline-none resize-none " +
      textClassName;

    return multiline ? (
      <textarea
        ref={textareaRef}
        value={draft}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={String(field)}
        className={sharedClass}
      />
    ) : (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={String(field)}
        className={sharedClass}
      />
    );
  }

  return (
    <span className="group inline-flex items-center gap-1.5">
      <span
        role="button"
        tabIndex={0}
        onClick={() => setEditing(true)}
        onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
        className={`cursor-pointer ${isEmpty ? "text-slate-400 italic text-sm" : textClassName}`}
        aria-label={`Edit ${String(field)}`}
      >
        {isEmpty ? placeholder : value}
      </span>

      {/* Pencil — visible on group hover */}
      <Pencil
        size={14}
        className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer shrink-0"
        aria-hidden="true"
        onClick={() => setEditing(true)}
      />

      {/* "Saved" flash */}
      {saved && (
        <span className="text-emerald-600 text-xs ml-1 animate-fade-in">
          Saved
        </span>
      )}
    </span>
  );
}
