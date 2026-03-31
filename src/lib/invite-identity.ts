const storagePrefix = "dividir.invite-member";

export function getStoredInviteIdentity(groupId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(`${storagePrefix}.${groupId}`);
}

export function getOrCreateInviteIdentity(groupId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = `${storagePrefix}.${groupId}`;
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const inviteIdentity = crypto.randomUUID();
  window.localStorage.setItem(storageKey, inviteIdentity);
  return inviteIdentity;
}
