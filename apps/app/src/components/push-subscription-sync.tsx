import { useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { useNotificationPreference } from "../hooks/use-notification-preference";
import {
  clearCurrentPushSubscription,
  ensureCurrentPushSubscription,
  hasPushSupport,
  serializePushSubscription,
} from "../lib/push-subscription";

export function PushSubscriptionSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { notificationsEnabled } = useNotificationPreference();
  const pushPublicKey = useQuery(
    api.notifications.pushPublicKey,
    isAuthenticated && !isLoading && notificationsEnabled && hasPushSupport() ? {} : "skip",
  );
  const upsertPushSubscription = useMutation(api.notifications.upsertPushSubscription);
  const removePushSubscription = useMutation(api.notifications.removePushSubscription);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !hasPushSupport()) {
      return;
    }

    let cancelled = false;

    async function syncPushSubscription() {
      if (!notificationsEnabled || typeof Notification === "undefined") {
        const endpoint = await clearCurrentPushSubscription();
        if (endpoint !== null) {
          await removePushSubscription({ endpoint });
        }
        return;
      }

      if (Notification.permission !== "granted") {
        const endpoint = await clearCurrentPushSubscription();
        if (endpoint !== null) {
          await removePushSubscription({ endpoint });
        }
        return;
      }

      if (!pushPublicKey) {
        return;
      }

      const subscription = await ensureCurrentPushSubscription(pushPublicKey);
      if (cancelled || subscription === null) {
        return;
      }

      await upsertPushSubscription(serializePushSubscription(subscription));
    }

    void syncPushSubscription();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    isLoading,
    notificationsEnabled,
    pushPublicKey,
    removePushSubscription,
    upsertPushSubscription,
  ]);

  return null;
}
