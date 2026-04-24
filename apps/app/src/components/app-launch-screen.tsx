import { Wallet } from "lucide-react";

export function AppLaunchScreen() {
  return (
    <div className="app-grid relative min-h-dvh overflow-x-hidden">
      <div className="app-screen-safe mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-obsidian-300 bg-obsidian-0 px-8 py-10">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-lime-500/12 blur-2xl" />
            <div className="surface-glow relative flex size-22 items-center justify-center rounded-[2rem] border border-lime-500/20 bg-[linear-gradient(180deg,rgba(212,255,0,0.1),rgba(18,18,18,0.96)_58%,rgba(8,8,8,0.98)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.42)]">
              <Wallet className="size-9 text-lime-500" />
            </div>
          </div>

          <div className="mt-8 space-y-3 text-center">
            <p className="font-display text-[2rem] font-black tracking-tight text-lime-500">
              DIVIDIR
            </p>
            <p className="font-display text-lg font-semibold tracking-tight text-ink-50">
              Preparando tu viaje
            </p>
            <p className="mx-auto max-w-xs text-sm leading-6 text-ink-300">
              Recuperando grupos, saldos y cambios pendientes para que vuelvas a donde estabas.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xs space-y-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-obsidian-200">
            <div className="h-full w-1/2 animate-[dividir-loader_1.4s_ease-in-out_infinite] rounded-full bg-lime-500" />
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-ink-500">
            Sincronizando sesión
          </p>
        </div>
      </div>
    </div>
  );
}
