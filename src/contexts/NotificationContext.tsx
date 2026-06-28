'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePusherNotifications } from '@/hooks/usePusherNotifications';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/notifications';
import { getProfile } from '@/lib/api/auth';
import type { AppNotification } from '@/types/notification';

// ─── Shape ───────────────────────────────────────────────────────────────────

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  /** Latest toast notification waiting to be displayed (null when none). */
  latestToast: AppNotification | null;
  dismissToast: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

// Sentinel so useNotificationContext can detect usage outside provider
const UNSET = Symbol('NotificationContext.unset');
const NotificationContext = createContext<NotificationContextValue | typeof UNSET>(UNSET);

// ─── Provider ────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);

  // ── Fetch userId from profile on mount (JWT is HttpOnly, can't read from cookie) ──
  useEffect(() => {
    getProfile()
      .then((res) => {
        const id: string | undefined = res?.data?.id;
        if (id) setUserId(id);
      })
      .catch(() => {
        // Guest or unauthenticated — no notifications needed
      });
  }, []);

  // ── Load initial notifications once we have the userId ────────────────────
  useEffect(() => {
    if (!userId) return;
    fetchNotifications(1, 20)
      .then(({ data, unreadCount: count }) => {
        setNotifications(data);
        setUnreadCount(count);
      })
      .catch(() => {/* non-critical */});
  }, [userId]);

  // ── Handle incoming real-time notification ────────────────────────────────
  const handleNotification = useCallback((notification: AppNotification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((c) => c + 1);
    setLatestToast(notification);
  }, []);

  usePusherNotifications(userId, handleNotification);

  // ── Toast auto-dismiss after 5 s ──────────────────────────────────────────
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!latestToast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLatestToast(null), 5000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [latestToast]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const dismissToast = useCallback(() => setLatestToast(null), []);

  const markRead = useCallback((id: string) => {
    markNotificationRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, latestToast, dismissToast, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (ctx === UNSET) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
