import { useEffect, useState } from "react";

const STORAGE_KEY = "dividir.notifications.enabled";

function readNotificationPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue === null) {
      return true;
    }

    return storedValue === "true";
  } catch {
    return true;
  }
}

export function useNotificationPreference() {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(
    readNotificationPreference,
  );

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setNotificationsEnabledState(event.newValue === "true");
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function setNotificationsEnabled(nextEnabled: boolean) {
    setNotificationsEnabledState(nextEnabled);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, nextEnabled ? "true" : "false");
    } catch {
      // Ignore storage errors and keep the in-memory state.
    }
  }

  return {
    notificationsEnabled,
    setNotificationsEnabled,
  };
}
