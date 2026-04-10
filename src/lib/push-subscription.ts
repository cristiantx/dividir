type PushSubscriptionRecord = {
  auth: string;
  endpoint: string;
  p256dh: string;
  userAgent?: string;
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function hasPushSupport() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function getCurrentPushSubscription() {
  if (!hasPushSupport()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

export async function ensureCurrentPushSubscription(publicKey: string) {
  if (!hasPushSupport()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription !== null) {
    return existingSubscription;
  }

  return await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(publicKey),
    userVisibleOnly: true,
  });
}

export async function clearCurrentPushSubscription() {
  const subscription = await getCurrentPushSubscription();
  if (subscription === null) {
    return null;
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}

export function serializePushSubscription(subscription: PushSubscription): PushSubscriptionRecord {
  const auth = subscription.getKey("auth");
  const p256dh = subscription.getKey("p256dh");

  if (!auth || !p256dh) {
    throw new Error("La suscripción push no tiene claves válidas.");
  }

  return {
    auth: arrayBufferToBase64(auth),
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(p256dh),
    userAgent: navigator.userAgent,
  };
}
