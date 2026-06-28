"use client";
// Shared presentation primitives for the EduGenie AI tutor (lesson / course /
// roadmap tiers). Keeps the bubble, typing indicator, icons, and notice styles
// consistent across every place the assistant is surfaced.

import type { AiChatMessage } from "@/lib/ai/useAiChat";

// ── Icons (inline SVG to match the codebase convention) ──────────────────────

export function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}

export function SendIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function RefreshIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

export function WarningIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function RouteIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M9 19h6a4 4 0 004-4V9M6 16V9a4 4 0 014-4h5" />
    </svg>
  );
}

// ── Streaming indicator ──────────────────────────────────────────────────────

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────────

export function MessageBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#3B1892] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <WarningIcon className="h-4 w-4" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-red-600">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#3B1892]">
        <SparkleIcon className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-700">
        {message.pending && !message.content ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap break-words">
            {message.content}
            {message.pending && (
              <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-[#3B1892]" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Full-panel state notice (offline / unauthenticated / error) ──────────────

export function StateNotice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <WarningIcon className="h-6 w-6" />
      </div>
      <p className="text-[14px] font-semibold text-slate-700">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-slate-500">
        {body}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-[#3B1892] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#2A1069]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
