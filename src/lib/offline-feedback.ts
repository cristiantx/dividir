import { toast } from "sonner";

export function showOfflineBlockedToast(message: string) {
  toast.error(message);
}

export function showQueuedMutationToast(message: string) {
  toast.info(message);
}

export function showSavedMutationToast(message: string) {
  toast.success(message);
}
