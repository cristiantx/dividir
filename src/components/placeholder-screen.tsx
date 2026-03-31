import { ArrowLeft, ChevronRight, Wallet } from "lucide-react";

type PlaceholderScreenProps = {
  action?: string;
  eyebrow: string;
  metric?: string;
  subtitle: string;
  title: string;
};

export function PlaceholderScreen({
  action = "Implementación en progreso",
  eyebrow,
  metric,
  subtitle,
  title,
}: PlaceholderScreenProps) {
  return (
    <main className="flex min-h-dvh flex-col bg-obsidian-0">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-obsidian-300 bg-obsidian-0/98 px-6 backdrop-blur">
        <button className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-lime-500 transition hover:border-obsidian-300 hover:bg-obsidian-100">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-lime-500" />
          <span className="font-display text-lg font-black tracking-tight text-lime-500">
            DIVIDIR
          </span>
        </div>
        <span className="w-10" />
      </header>

      <section className="flex flex-1 flex-col px-6 pb-28 pt-10">
        <div className="mb-8 space-y-3">
          <p className="text-kicker font-mono text-[11px] text-ink-500">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink-50">
              {title}
            </h1>
            <p className="max-w-sm text-sm leading-6 text-ink-300">{subtitle}</p>
          </div>
        </div>

        {metric ? (
          <div className="surface-glow mb-8 rounded-3xl border border-obsidian-300 bg-obsidian-100 px-6 py-8">
            <p className="text-kicker mb-3 font-mono text-[11px] text-ink-500">Estado base</p>
            <p className="text-metric text-4xl font-bold tracking-tight text-lime-500">
              {metric}
            </p>
          </div>
        ) : null}

        <div className="surface-glow rounded-3xl border border-dashed border-obsidian-400 bg-obsidian-100/70 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold text-ink-50">{action}</p>
              <p className="mt-2 text-sm text-ink-300">
                Esta ruta ya existe en el router y en el siguiente paso pasa de stub a pantalla
                final.
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-lime-500" />
          </div>

          <ul className="space-y-3 border-t border-obsidian-300/70 pt-4 text-sm text-ink-300">
            <li>Tailwind y tokens visuales listos.</li>
            <li>TanStack Router listo para navegación real.</li>
            <li>PWA y layout móvil base conectados.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
