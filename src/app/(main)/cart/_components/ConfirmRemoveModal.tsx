// src/app/(main)/cart/_components/ConfirmRemoveModal.tsx

interface ConfirmRemoveModalProps {
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Inline (non-portal) confirm/cancel UI rendered within an item card.
 * Matches the inline confirm pattern established in the CartSummary component.
 */
export default function ConfirmRemoveModal({
  itemTitle,
  onConfirm,
  onCancel,
}: ConfirmRemoveModalProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-slate-500">Remove?</span>
      <button
        onClick={onCancel}
        aria-label={`Cancel removing ${itemTitle}`}
        className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        aria-label={`Confirm remove ${itemTitle}`}
        className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors"
      >
        Remove
      </button>
    </div>
  );
}
