import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import type { AppNotification } from '@/types/notification';

/**
 * Subscribes to the Pusher channel `user-{userId}` and calls
 * `onNotification` for every `new-notification` event.
 *
 * Uses a ref for the callback so the Pusher connection is only
 * created/destroyed when `userId` changes — not on every render.
 */
export function usePusherNotifications(
  userId: string | undefined,
  onNotification: (data: AppNotification) => void,
) {
  // Keep a stable ref so Pusher bind never needs to be re-registered
  const callbackRef = useRef(onNotification);
  useEffect(() => {
    callbackRef.current = onNotification;
  });

  useEffect(() => {
    if (!userId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${userId}`);

    const handler = (data: AppNotification) => callbackRef.current(data);
    channel.bind('new-notification', handler);

    return () => {
      channel.unbind('new-notification', handler);
      pusher.unsubscribe(`user-${userId}`);
      pusher.disconnect();
    };
  }, [userId]); // only re-run when userId changes
}
