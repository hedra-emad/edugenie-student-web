"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ProfileUpdatePayload } from "@/types/profile.types";

const MAX_TAGS = 10;

interface Props {
  tags: string[];
  field: Extract<keyof ProfileUpdatePayload, "skills" | "interests">;
  label: string;
  onChange: (updated: string[]) => void;
  isPending: boolean;
}

export default function TagsEditor({ tags, field, label, onChange, isPending }: Props) {
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function showError(msg: string) {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 3000);
  }

  function addTag() {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setAdding(false);
      setInputVal("");
      return;
    }
    if (tags.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      showError(`"${trimmed}" is already in your ${label.toLowerCase()}.`);
      return;
    }
    if (tags.length >= MAX_TAGS) {
      showError(`Maximum ${MAX_TAGS} ${label.toLowerCase()} allowed.`);
      return;
    }
    onChange([...tags, trimmed]);
    setInputVal("");
    setAdding(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Escape") {
      setAdding(false);
      setInputVal("");
    }
  }

  const atMax = tags.length >= MAX_TAGS;

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <AnimatePresence initial={false}>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: isPending ? 0.6 : 1, x: 0 }}
              exit={{ opacity: 0, x: -8, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                         border border-slate-300 bg-white text-slate-700
                         hover:border-[#3B1892] hover:text-[#3B1892] transition-colors duration-150"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={isPending}
                aria-label={`Remove ${tag} from ${label}`}
                className="ml-0.5 text-slate-400 hover:text-[#3B1892] disabled:cursor-not-allowed transition-colors"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Inline add input */}
        {adding ? (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={addTag}
            onKeyDown={handleKeyDown}
            placeholder={`Add ${field}…`}
            aria-label={`New ${field}`}
            className="px-2.5 py-1 rounded-full text-xs border border-[#3B1892] outline-none w-32 bg-white text-slate-700"
          />
        ) : (
          !atMax && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdding(true)}
              disabled={isPending}
              aria-label={`Add a ${field}`}
              leftIcon={<Plus size={12} aria-hidden="true" />}
            >
              Add {field}
            </Button>
          )
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
