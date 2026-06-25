import { useEffect } from "react";
import Pusher from "pusher-js";

export function usePusherNotifications(
  userId: string | undefined,
  onNotification: (data: any) => void
) {
  useEffect(() => {
    if (!userId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`user-${userId}`);
    channel.bind("new-notification", onNotification);

    return () => {
      channel.unbind("new-notification", onNotification);
      pusher.unsubscribe(`user-${userId}`);
      pusher.disconnect();
    };
  }, [userId, onNotification]);
}
