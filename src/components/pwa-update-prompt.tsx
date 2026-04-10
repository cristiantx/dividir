import { useEffect, useRef } from "react";
import { DownloadCloud, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  });
  const toastIdRef = useRef<ReturnType<typeof toast.custom> | null>(null);

  useEffect(() => {
    if (!needRefresh) {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      return;
    }

    if (toastIdRef.current !== null) {
      return;
    }

    const toastId = toast.custom(
      (id) => (
        <div className="w-[min(100vw-2rem,26rem)] overflow-hidden rounded-[1.4rem] border border-lime-500/30 bg-[linear-gradient(180deg,rgba(212,255,0,0.12),rgba(8,8,8,0.97)_28%,rgba(8,8,8,0.98)_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur">
          <div className="flex items-start gap-4 px-5 py-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-lime-500/25 bg-lime-500/12 text-lime-500">
              <DownloadCloud className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold tracking-tight text-ink-50">
                Hay una versión nueva de Dividir
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-300">
                Actualiza cuando te venga bien. Recargar aplicará los archivos nuevos y te dejará en la versión más reciente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNeedRefresh(false);
                toast.dismiss(id);
              }}
              className="mt-0.5 inline-flex size-8 items-center justify-center rounded-full border border-obsidian-300 text-ink-500 transition hover:border-ink-500 hover:text-ink-50"
              aria-label="Cerrar aviso de actualización"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-3 border-t border-obsidian-300/80 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setNeedRefresh(false);
                toast.dismiss(id);
              }}
              className="flex-1 rounded-full border border-obsidian-300 bg-transparent px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-300 transition hover:border-ink-500 hover:text-ink-50"
            >
              Luego
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(id);
                void updateServiceWorker(true);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-lime-500 px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-obsidian-0 transition hover:opacity-95"
            >
              <RefreshCw className="size-4" />
              Recargar
            </button>
          </div>
        </div>
      ),
      {
        duration: Number.POSITIVE_INFINITY,
      },
    );

    toastIdRef.current = toastId;

    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
