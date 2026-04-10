import { Download, ExternalLink, PlusSquare } from "lucide-react";

import { cn } from "../lib/cn";

type InstallAppCardProps = {
  canInstall: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  isIos: boolean;
  onInstall: () => Promise<void> | void;
};

export function InstallAppCard({
  canInstall,
  isInstalled,
  isInstalling,
  isIos,
  onInstall,
}: InstallAppCardProps) {
  if (isInstalled) {
    return null;
  }

  return (
    <section className="surface-glow mt-6 overflow-hidden rounded-[1.4rem] border border-lime-500/25 bg-[linear-gradient(180deg,rgba(212,255,0,0.1),rgba(212,255,0,0.03)_34%,rgba(8,8,8,0.96)_100%)]">
      <div className="border-b border-lime-500/15 px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-lime-500/90">
          App en tu inicio
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
              "border-lime-500/25 bg-lime-500/10 text-lime-500",
            )}
          >
            {canInstall ? (
              <Download className="size-5" />
            ) : (
              <PlusSquare className="size-5" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink-50">
              Instala Dividir como app
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-300">
              Guárdala en tu pantalla de inicio para abrirla más rápido, usarla en modo standalone
              y volver al grupo sin ruido de navegador.
            </p>
          </div>
        </div>

        {canInstall ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void onInstall()}
              disabled={isInstalling}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-lime-500 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-obsidian-0 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="size-4" />
              {isInstalling ? "Abriendo instalador" : "Instalar app"}
            </button>
            <p className="text-sm leading-6 text-ink-500">
              Abriremos el diálogo del sistema. Si lo cierras, puedes volver a instalarla desde aquí.
            </p>
          </div>
        ) : null}

        {!isInstalled && !canInstall && isIos ? (
          <div className="rounded-2xl border border-obsidian-300 bg-obsidian-50/70 p-4">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-200">
              En iPhone o iPad
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-ink-300">
              <li>1. Abre Dividir en Safari.</li>
              <li>2. Toca Compartir.</li>
              <li>3. Elige “Añadir a pantalla de inicio”.</li>
            </ol>
          </div>
        ) : null}

        {!isInstalled && !canInstall && !isIos ? (
          <div className="rounded-2xl border border-obsidian-300 bg-obsidian-50/70 p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-ink-500" />
              <p className="text-sm leading-6 text-ink-300">
                Si tu navegador no muestra el instalador todavía, usa el menú del navegador y busca
                la opción para instalar o añadir esta app al inicio.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
