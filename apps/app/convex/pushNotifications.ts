"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const pushMessageValidator = v.object({
  auth: v.string(),
  body: v.string(),
  endpoint: v.string(),
  notificationId: v.id("notifications"),
  p256dh: v.string(),
  title: v.string(),
  url: v.string(),
});

const pushEnv = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

function getVapidSubject() {
  return pushEnv?.PUSH_VAPID_SUBJECT?.trim() || "mailto:hello@dividir.app";
}

function getVapidPublicKey() {
  return pushEnv?.PUSH_VAPID_PUBLIC_KEY?.trim() || null;
}

function getVapidPrivateKey() {
  return pushEnv?.PUSH_VAPID_PRIVATE_KEY?.trim() || null;
}

export const sendPushNotifications = internalAction({
  args: {
    messages: v.array(pushMessageValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const publicKey = getVapidPublicKey();
    const privateKey = getVapidPrivateKey();

    if (!publicKey || !privateKey) {
      return null;
    }

    webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);

    for (const message of args.messages) {
      try {
        await webpush.sendNotification(
          {
            endpoint: message.endpoint,
            keys: {
              auth: message.auth,
              p256dh: message.p256dh,
            },
          },
          JSON.stringify({
            body: message.body,
            notificationId: message.notificationId,
            title: message.title,
            url: message.url,
          }),
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await ctx.runMutation(internal.notifications.removePushSubscriptionByEndpoint, {
            endpoint: message.endpoint,
          });
        }
      }
    }

    return null;
  },
});
