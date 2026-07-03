"use client";
// src/app/(main)/cart/_components/ConfirmRemoveModal.tsx

import { useRef, useEffect, type KeyboardEvent } from "react";
import Button from "@/components/ui/Button";

interface ConfirmRemoveModalProps {
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Inline (non-portal) confirm/cancel UI rendered within an item card.
 * Matches the inline confirm pattern established in the CartSummary component.
 *
 * Accessibility: traps focus within the two buttons while the modal is open.
 * Cancel receives focus on mount (safer default). Tab/Shift+Tab cycle only
 * between Cancel and Remove.
 */
export default function ConfirmRemoveModal({
  itemTitle,
  onConfirm,
  onCancel,
}: ConfirmRemoveModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Move focus to Cancel on mount
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Trap Tab/Shift+Tab within the two focusable buttons
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;

    e.preventDefault();

    if (e.shiftKey) {
      // Shift+Tab: cycle backwards
      if (document.activeElement === cancelRef.current) {
        confirmRef.current?.focus();
      } else {
        cancelRef.current?.focus();
      }
    } else {
      // Tab: cycle forwards
      if (document.activeElement === cancelRef.current) {
        confirmRef.current?.focus();
      } else {
        cancelRef.current?.focus();
      }
    }
  }

  return (
    <div
      role="group"
      aria-label="Confirm removal"
      className="flex items-center gap-2"
      onKeyDown={handleKeyDown}
    >
      <span className="text-[12px] text-slate-500">Remove?</span>
      <Button
        ref={cancelRef}
        variant="ghost"
        size="sm"
        onClick={onCancel}
        aria-label={`Cancel removing ${itemTitle}`}
      >
        Cancel
      </Button>
      <Button
        ref={confirmRef}
        variant="ghost"
        size="sm"
        onClick={onConfirm}
        aria-label={`Confirm remove ${itemTitle}`}
        className="text-red-500 hover:text-red-700"
      >
        Remove
      </Button>
    </div>
  );
}
