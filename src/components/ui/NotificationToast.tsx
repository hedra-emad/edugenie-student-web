'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useNotifications } from '@/contexts/NotificationContext';
import type { AppNotification } from '@/types/notification';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'info';

function getVariant(type: AppNotification['type']): ToastVariant {
  switch (type) {
    case 'COURSE_APPROVED':
    case 'CERTIFICATE_EARNED':
    case 'COURSE_COMPLETED':
    case 'PURCHASE_COMPLETED':
    case 'EARNING_RECORDED':
      return 'success';
    case 'COURSE_REJECTED':
    case 'PAYMENT_FAILED':
    case 'CONTENT_REMOVED':
      return 'error';
    default:
      return 'info';
  }
}

// Built from tokens that actually exist in this app's Tailwind v4 @theme /
// :root (color-primary, color-secondary, color-error, color-primary-dark,
// color-primary-light). There is no --toast-success-gradient here — that
// was an Angular-only token — so the success gradient is composed inline
// from --color-primary + --color-secondary instead.
const variantBackground: Record<ToastVariant, string> = {
  success: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  error: 'linear-gradient(135deg, var(--color-error), #dc2626)',
  info: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))',
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <svg className="w-4 h-4 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (variant === 'error') {
    return (
      <svg className="w-4 h-4 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25h.007v.008H12V8.25Zm0 3v4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// ─── Single Toast Card ────────────────────────────────────────────────────────

interface ToastCardProps {
  notification: AppNotification;
  onDismiss: () => void;
}

function ToastCard({ notification, onDismiss }: ToastCardProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(showTimer);
  }, []);

  // Visual taper before the 5s unmount driven by NotificationContext.
  useEffect(() => {
    const fadeStart = setTimeout(() => setFadingOut(true), 4800);
    return () => clearTimeout(fadeStart);
  }, []);

  const variant = getVariant(notification.type);
  const truncatedMsg = notification.message?.split('Reason:')[0].trim() ?? '';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        relative overflow-hidden
        min-w-[280px] sm:min-w-[350px] max-w-[320px] sm:max-w-[450px]
        transition-all duration-300
        ${visible && !fadingOut ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
      `}
      style={{
        background: variantBackground[variant],
        color: '#fff',
        boxShadow: 'var(--shadow-card)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
      }}
    >
      <div className="flex items-center gap-3">
        <VariantIcon variant={variant} />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium block truncate">
            {notification.title}
          </span>
          {truncatedMsg && (
            <span className="text-xs text-white/80 block truncate">
              {truncatedMsg}
            </span>
          )}
        </div>
        <Button
          variant="ghostOnColor"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Progress bar, same as .toast-progress in the Angular app */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        }}
      />
    </div>
  );
}

// ─── Toast Container — bottom-left, matches .toast-container.toast-bottom-left ─

export default function NotificationToast() {
  const { latestToast, dismissToast } = useNotifications();

  if (!latestToast) return null;

  return (
    <div
      className="fixed z-50 bottom-5 left-5"
      aria-label="Notifications"
    >
      <ToastCard
        key={latestToast.id}
        notification={latestToast}
        onDismiss={dismissToast}
      />
    </div>
  );
}