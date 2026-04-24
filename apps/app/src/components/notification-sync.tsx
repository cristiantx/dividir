import { useEffect, useRef } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { useNotificationPreference } from "../hooks/use-notification-preference";

type AppNavigator = Navigator & {
  clearAppBadge?: () => Promise<void> | void;
  setAppBadge?: (contents?: number) => Promise<void> | void;
};

export function NotificationSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { notificationsEnabled } = useNotificationPreference();
  const unreadNotifications = useQuery(
    api.notifications.listUnread,
    isAuthenticated && !isLoading ? {} : "skip",
  );
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    isAuthenticated && !isLoading ? {} : "skip",
  );
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      initializedRef.current = false;
      seenIdsRef.current.clear();
      void updateAppBadge(0);
      return;
    }

    if (!notificationsEnabled) {
      void updateAppBadge(0);
      return;
    }

    void updateAppBadge(unreadCount ?? 0);
  }, [isAuthenticated, isLoading, notificationsEnabled, unreadCount]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || unreadNotifications === undefined) {
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      unreadNotifications.forEach((notification) => {
        seenIdsRef.current.add(notification.notificationId);
      });
      return;
    }

    if (!notificationsEnabled) {
      unreadNotifications.forEach((notification) => {
        seenIdsRef.current.add(notification.notificationId);
      });
      return;
    }

    const freshNotifications = unreadNotifications.filter(
      (notification) => !seenIdsRef.current.has(notification.notificationId),
    );

    if (freshNotifications.length === 0) {
      return;
    }

    freshNotifications.sort((left, right) => left.createdAt - right.createdAt);

    for (const notification of freshNotifications) {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        toast.info(notification.title, {
          description: notification.body,
        });
      }

      seenIdsRef.current.add(notification.notificationId);
    }
  }, [isAuthenticated, isLoading, notificationsEnabled, unreadNotifications]);

  return null;
}

async function updateAppBadge(count: number) {
  if (typeof navigator === "undefined") {
    return;
  }

  const appNavigator = navigator as AppNavigator;

  if (count > 0) {
    await appNavigator.setAppBadge?.(count);
    return;
  }

  await appNavigator.clearAppBadge?.();
}
