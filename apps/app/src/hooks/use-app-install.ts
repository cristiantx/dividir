import { useCallback, useEffect, useState } from "react";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

function detectIos() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function detectStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigator.standalone === true
  );
}

export function useAppInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => detectStandaloneMode());
  const [isInstalling, setIsInstalling] = useState(false);
  const isIos = detectIos();

  useEffect(() => {
    function syncStandaloneMode() {
      setIsStandalone(detectStandaloneMode());
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallEvent(null);
      syncStandaloneMode();
    }

    syncStandaloneMode();

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");

    standaloneMedia.addEventListener("change", syncStandaloneMode);
    fullscreenMedia.addEventListener("change", syncStandaloneMode);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      standaloneMedia.removeEventListener("change", syncStandaloneMode);
      fullscreenMedia.removeEventListener("change", syncStandaloneMode);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) {
      return null;
    }

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome !== "accepted") {
        return choice;
      }

      setInstallEvent(null);
      return choice;
    } finally {
      setIsInstalling(false);
    }
  }, [installEvent]);

  const canInstall = installEvent !== null && !isStandalone;

  return {
    canInstall,
    isInstalled: isStandalone,
    isInstalling,
    isIos,
    promptInstall,
  };
}
