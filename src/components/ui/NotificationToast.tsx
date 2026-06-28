'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { AppNotification } from '@/types/notification';

// ─── Icons ────────────────────────────────────────────────────────────────────

function SuccessIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

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

const variantStyles: Record<ToastVariant, { bar: string; icon: string; iconBg: string }> = {
  success: {
    bar: 'bg-[--color-success]',
    icon: 'text-[--color-success]',
    iconBg: 'bg-green-50',
  },
  error: {
    bar: 'bg-[--color-error]',
    icon: 'text-[--color-error]',
    iconBg: 'bg-red-50',
  },
  info: {
    bar: 'bg-[--color-primary]',
    icon: 'text-[--color-primary]',
    iconBg: 'bg-indigo-50',
  },
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <SuccessIcon />;
  if (variant === 'error') return <ErrorIcon />;
  return <InfoIcon />;
}

// ─── Single Toast Card ────────────────────────────────────────────────────────

interface ToastCardProps {
  notification: AppNotification;
  onDismiss: () => void;
}

function ToastCard({ notification, onDismiss }: ToastCardProps) {
  const [visible, setVisible] = useState(false);

  // Slide-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const variant = getVariant(notification.type);
  const styles = variantStyles[variant];
  const truncatedMsg = notification.message?.split('Reason:')[0].trim() ?? '';

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
      }}
      className="flex w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5"
    >
      {/* Left accent bar */}
      <div className={`w-1 shrink-0 ${styles.bar}`} />

      {/* Icon */}
      <div className={`flex items-start p-3 ${styles.iconBg}`}>
        <span className={styles.icon}>
          <VariantIcon variant={variant} />
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-3 py-3 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
          {notification.title}
        </p>
        {truncatedMsg && (
          <p className="mt-0.5 text-xs text-gray-500 leading-snug line-clamp-2">
            {truncatedMsg}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="flex items-start p-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ─── Toast Container (portal-like, fixed bottom-right) ────────────────────────

/**
 * Renders the real-time notification toast in the bottom-right corner.
 * Reads from NotificationContext — must be inside <NotificationProvider>.
 */
export default function NotificationToast() {
  const { latestToast, dismissToast } = useNotifications();

  if (!latestToast) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto">
        <ToastCard
          key={latestToast.id}
          notification={latestToast}
          onDismiss={dismissToast}
        />
      </div>
    </div>
  );
}
