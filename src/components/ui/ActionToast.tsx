"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import Button from "./Button";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ActionToastProps {
  kind: "success" | "error";
  message: string;
  /** Optional action button (e.g. "Retry"). Runs, then dismisses. */
  action?: ToastAction;
  onClose: () => void;
  /** Auto-dismiss after N ms (0 = stay until dismissed). Defaults: success 4000, error 0. */
  duration?: number;
}

/**
 * Lightweight, self-contained action alert. Bottom-right so it never collides
 * with the Pusher NotificationToast (bottom-left). Used for local, immediate
 * feedback like "Profile picture updated".
 */
export default function ActionToast({
  kind,
  message,
  action,
  onClose,
  duration,
}: ActionToastProps) {
  const autoMs = duration ?? (kind === "success" ? 4000 : 0);

  useEffect(() => {
    if (!autoMs) return;
    const t = setTimeout(onClose, autoMs);
    return () => clearTimeout(t);
  }, [autoMs, onClose]);

  const isSuccess = kind === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5"
    >
      <span
        className={isSuccess ? "mt-0.5 text-[#22C55E]" : "mt-0.5 text-[#EF4444]"}
        aria-hidden="true"
      >
        {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </span>

      <p className="flex-1 pt-0.5 text-sm text-slate-700">{message}</p>

      {action && (
        <Button
          variant="link"
          size="sm"
          className="shrink-0"
          onClick={() => {
            action.onClick();
            onClose();
          }}
        >
          {action.label}
        </Button>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="-mr-1 mt-0.5 shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
      >
        <X size={15} />
      </button>
    </div>
  );
}
