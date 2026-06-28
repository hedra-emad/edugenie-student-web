import type { AppNotification } from '@/types/notification';

// Client-side: goes through /api/proxy so the jwt cookie stays same-domain.
// Server-side: this file should not be imported in Server Components directly.
const BASE_URL = '/api/proxy';
const NOTIFICATIONS_URL = `${BASE_URL}/notifications`;

export async function fetchNotifications(
  page = 1,
  limit = 20,
): Promise<{ data: AppNotification[]; unreadCount: number; meta: { hasNextPage: boolean } }> {
  const res = await fetch(`${NOTIFICATIONS_URL}?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const json = await res.json();
  // Backend wraps in { data: { data: [], unreadCount, meta } }
  const payload = json?.data ?? json;
  return {
    data: payload?.data ?? [],
    unreadCount: payload?.unreadCount ?? 0,
    meta: { hasNextPage: Boolean(payload?.meta?.hasNextPage) },
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${NOTIFICATIONS_URL}/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${NOTIFICATIONS_URL}/mark-all-read`, {
    method: 'PATCH',
    credentials: 'include',
  });
}
