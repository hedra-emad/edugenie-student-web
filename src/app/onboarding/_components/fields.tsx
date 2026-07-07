"use client";
// Small form primitives for the onboarding wizard, matching the roadmap intake
// chip pattern (brand #3B1892). Accessible: chips are aria-pressed buttons,
// fields have associated labels, tag input is keyboard-driven.

import { useState, type ReactNode } from "react";

export function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[14px] font-bold text-slate-800"
      >
        {label}
        {required && <span className="ml-0.5 text-[#3B1892]">*</span>}
      </label>
      {hint && <p className="mb-2.5 -mt-1 text-[12.5px] text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

export function Chip({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-4 py-2.5 text-left text-[13.5px] font-semibold transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892] focus-visible:ring-offset-1
                  ${
                    selected
                      ? "border-[#3B1892] bg-[#3B1892] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#3B1892]/50 hover:bg-violet-50/50"
                  }`}
    >
      <span className="block">{label}</span>
      {description && (
        <span
          className={`mt-0.5 block text-[11.5px] font-normal ${
            selected ? "text-white/80" : "text-slate-400"
          }`}
        >
          {description}
        </span>
      )}
    </button>
  );
}

/** Single-select row of chips. */
export function ChipRow({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          description={o.description}
          selected={value === o.value}
          onClick={() => onSelect(o.value)}
        />
      ))}
    </div>
  );
}

/** Free-entry tag input: type + Enter to add, click × to remove. */
export function TagInput({
  id,
  values,
  onChange,
  placeholder,
  suggestions = [],
}: {
  id?: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (values.some((v) => v.toLowerCase() === t.toLowerCase())) return;
    if (values.length >= 30) return;
    onChange([...values, t]);
    setDraft("");
  };
  const remove = (t: string) => onChange(values.filter((v) => v !== t));

  const unusedSuggestions = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-[#3B1892]">
        {values.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1 text-[12.5px] font-semibold text-[#3B1892]"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove ${t}`}
              className="rounded text-[#3B1892]/70 hover:text-[#3B1892] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && values.length) {
              remove(values[values.length - 1]);
            }
          }}
          placeholder={values.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-[13.5px] text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      {unusedSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-500
                         transition-colors hover:border-[#3B1892] hover:text-[#3B1892]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
