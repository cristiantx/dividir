/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

type PushPayload = {
  body?: string;
  notificationId?: string;
  title?: string;
  url?: string;
};

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  event.waitUntil(handlePushEvent(event));
});

self.addEventListener("notificationclick", (event) => {
  const payload = event.notification.data as PushPayload | undefined;
  const targetUrl = payload?.url ?? "/notifications";

  event.notification.close();
  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });

      for (const client of windowClients) {
        const windowClient = client as WindowClient;
        if ("navigate" in windowClient) {
          await windowClient.navigate(targetUrl);
        }

        await windowClient.focus();
        return;
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});

async function handlePushEvent(event: PushEvent) {
  if (!event.data) {
    return;
  }

  let payload: PushPayload | null = null;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = null;
  }

  if (!payload?.title) {
    return;
  }

  const visibleClients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });
  const hasVisibleClient = visibleClients.some((client) => {
    if (!("visibilityState" in client)) {
      return false;
    }

    return client.visibilityState !== "hidden";
  });

  if (hasVisibleClient) {
    return;
  }

  await self.registration.showNotification(payload.title, {
    badge: "/maskable-192x192.png",
    body: payload.body,
    data: payload,
    icon: "/pwa-192x192.png",
    tag: payload.notificationId,
  });
}
