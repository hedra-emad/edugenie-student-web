"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";

interface SkillsEditorProps {
  items: string[];
  onChange: (skills: string[]) => void;
  isPending: boolean;
}

export default function SkillsEditor({ items, onChange, isPending }: SkillsEditorProps) {
  const [adding, setAdding]     = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function clearErrorAfter3s() {
    setTimeout(() => setError(null), 3000);
  }

  function addSkill() {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setAdding(false);
      setInputVal("");
      return;
    }
    if (items.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError("That skill is already listed.");
      clearErrorAfter3s();
      return;
    }
    onChange([...items, trimmed]);
    setInputVal("");
    setAdding(false);
  }

  function removeSkill(skill: string) {
    onChange(items.filter((s) => s !== skill));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addSkill();
    if (e.key === "Escape") {
      setAdding(false);
      setInputVal("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((skill) => (
          <span
            key={skill}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 transition-opacity ${isPending ? "opacity-60" : ""}`}
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              disabled={isPending}
              aria-label={`Remove ${skill}`}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed ml-0.5"
            >
              {/* × icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}

        {adding ? (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={addSkill}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React"
            className="px-3 py-1 rounded-full text-xs border border-[#3B1892] outline-none w-32 bg-white"
            aria-label="New skill"
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            disabled={isPending}
            aria-label="Add a skill"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Add skill
          </Button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}