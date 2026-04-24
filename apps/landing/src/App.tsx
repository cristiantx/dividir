import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Luggage,
  Plus,
  ReceiptText,
  Send,
  Split,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const appUrl = "https://go.dividir.app/groups";
const loginUrl = "https://go.dividir.app/login";

const revealCopy =
  "Dividir ordena los pagos del grupo mientras el viaje sigue. Cada gasto queda claro, cada saldo se entiende rápido y el cierre deja de depender de una planilla improvisada.";

const steps = [
  {
    icon: UsersRound,
    title: "Creá el grupo",
    text: "Sumá a quienes viajan, elegí la moneda y dejá el espacio listo antes de salir.",
  },
  {
    icon: ReceiptText,
    title: "Cargá gastos",
    text: "Registrá cenas, taxis, alojamiento o súper con quién pagó y quién participa.",
  },
  {
    icon: CircleDollarSign,
    title: "Liquidá saldos",
    text: "Al final, Dividir muestra quién paga a quién con menos vueltas.",
  },
];

const contextItems = [
  {
    icon: ReceiptText,
    title: "Cena",
    text: "Pagó Sofi",
    amount: "$48.200",
    status: "4 personas",
  },
  {
    icon: Send,
    title: "Taxi",
    text: "Pagó Martín",
    amount: "$18.900",
    status: "3 personas",
  },
  {
    icon: Luggage,
    title: "Casa",
    text: "Pagó Juli",
    amount: "$210.000",
    status: "5 personas",
  },
];

export function LandingScreen() {
  const rootRef = useRef<HTMLElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "Dividir - Gastos compartidos para viajes y grupos";
  }, []);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            opacity: 0.86,
            scale: 0.96,
            y: 40,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              end: "top 40%",
              scrub: true,
            },
          },
        );
      });

      const visualCards = gsap.utils.toArray<HTMLElement>("[data-visual-card]");
      visualCards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.72, scale: 0.94 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 82%",
              end: "bottom 52%",
              scrub: true,
            },
          },
        );
      });
    },
    { scope: rootRef },
  );

  return (
    <main ref={rootRef} className="w-full max-w-full overflow-x-hidden bg-obsidian-0 text-ink-50">
      <nav className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
        <div className="surface-glow mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-obsidian-300/80 bg-obsidian-0/82 px-4 py-3 backdrop-blur-xl">
          <a href="/" aria-label="Dividir inicio" className="flex items-center gap-2">
            <Wallet className="size-5 text-lime-500" />
            <span className="font-display text-lg font-black uppercase tracking-tight text-lime-500">
              DIVIDIR
            </span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-ink-300 md:flex">
            <a className="transition hover:text-ink-50" href="#como-funciona">
              Cómo funciona
            </a>
            <a className="transition hover:text-ink-50" href="#beneficios">
              Beneficios
            </a>
          </div>
          <a
            href={loginUrl}
            className="inline-flex h-10 items-center justify-center rounded-full bg-lime-500 px-4 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-obsidian-0 transition hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-obsidian-0"
          >
            Abrir app
          </a>
        </div>
      </nav>

      <section className="app-grid relative min-h-dvh overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:px-12 lg:pt-32">
        <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-lime-500/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-mint-500/10 blur-[100px]" />

        <div className="relative mx-auto grid min-h-[calc(100dvh-12rem)] max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-16">
          <div className="max-w-6xl">
            <h1 className="max-w-6xl font-display text-[clamp(2.9rem,5.3vw,5rem)] font-black leading-[0.92] tracking-normal text-ink-50">
              Dividí gastos de viaje sin planillas.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-300 sm:text-xl">
              Dividir ayuda a grupos a registrar pagos, entender saldos y cerrar quién le debe a
              quién con una experiencia simple, mobile y en español.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={appUrl}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-lime-500 px-6 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-obsidian-0 transition hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-obsidian-0"
              >
                Empezar ahora
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#como-funciona"
                className="inline-flex h-14 items-center justify-center rounded-full border border-obsidian-300 bg-obsidian-100 px-6 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-ink-50 transition hover:border-lime-500 hover:text-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-obsidian-0"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          <HeroMockup />
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative scroll-mt-28 px-5 py-24 sm:px-8 md:py-32 lg:px-12"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-5xl">
            <h2 className="font-display text-[clamp(2.4rem,5vw,5rem)] font-black leading-none tracking-normal text-ink-50">
              Cuentas claras mientras el viaje sigue.
            </h2>
            <p className="mt-8 max-w-4xl text-2xl font-semibold leading-snug text-ink-200 sm:text-3xl">
              {revealCopy}
            </p>
          </div>

          <div ref={stackRef} className="mt-16 grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                data-stack-card
                className="surface-glow group rounded-xl border border-obsidian-300 bg-obsidian-100 p-7 transition hover:border-lime-500"
              >
                <div className="mb-12 flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200 text-lime-500 transition group-hover:scale-105">
                    <step.icon className="size-5" />
                  </div>
                  <span className="font-mono text-sm font-bold text-ink-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold tracking-normal text-ink-50">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-ink-300">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="scroll-mt-28 px-5 py-24 sm:px-8 md:py-32 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl font-display text-[clamp(2.4rem,5vw,5rem)] font-black leading-none tracking-normal text-ink-50">
              Lo justo para viajar liviano.
            </h2>
            <p className="max-w-sm text-base leading-7 text-ink-300">
              Registrá pagos, mirá balances y cerrá lo pendiente con menos conversaciones
              incómodas al final del viaje.
            </p>
          </div>

          <div className="grid-flow-dense grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-4">
            <article
              data-visual-card
              className="surface-glow group overflow-hidden rounded-xl border border-obsidian-300 bg-obsidian-100 p-6 transition hover:border-lime-500 md:col-span-2 md:row-span-2"
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="overflow-hidden rounded-lg border border-obsidian-300 bg-obsidian-0">
                  <div className="bg-[radial-gradient(circle_at_22%_10%,rgba(212,255,0,0.2),transparent_36%),radial-gradient(circle_at_80%_60%,rgba(0,255,157,0.14),transparent_38%)] p-5 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-ink-50">
                        Viaje a Ibiza 2024
                      </span>
                      <BadgeCheck className="size-5 text-lime-500" />
                    </div>
                    <div className="grid gap-3">
                      {[
                        ["Sofi", "Debe recibir", "+$32.400", "text-mint-500"],
                        ["Martín", "Debe pagar", "-$18.900", "text-rose-500"],
                        ["Juli", "Saldado", "$0", "text-ink-300"],
                      ].map(([name, status, amount, color]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-lg border border-obsidian-300 bg-obsidian-100 px-4 py-3"
                        >
                          <div>
                            <p className="font-display text-sm font-bold text-ink-50">{name}</p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                              {status}
                            </p>
                          </div>
                          <span className={`font-mono text-lg font-bold ${color}`}>{amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-bold text-ink-50">Balance claro</h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-ink-300">
                    Los saldos se leen de un vistazo, con estados simples para saber quién recibe,
                    quién paga y quién ya está saldado.
                  </p>
                </div>
              </div>
            </article>

            <BenefitCard icon={Luggage} title="Viajes primero">
              Restaurantes, traslados, alojamiento y compras quedan en el mismo grupo.
            </BenefitCard>
            <BenefitCard icon={Split} title="Menos transferencias">
              La liquidación final reduce vueltas y conversaciones incómodas.
            </BenefitCard>
            <article
              data-visual-card
              className="surface-glow group overflow-hidden rounded-xl border border-obsidian-300 bg-obsidian-100 p-6 transition hover:border-lime-500 md:col-span-2"
            >
              <div className="flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-8 flex size-12 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200 text-lime-500 transition duration-700 ease-out group-hover:scale-105">
                    <Wallet className="size-5" />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-ink-50">Sin planillas</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-ink-300">
                    Una experiencia mobile para registrar el gasto en el momento y seguir con el
                    viaje.
                  </p>
                </div>
                <div className="grid min-w-[180px] gap-2 font-mono text-xs text-lime-500">
                  <span className="rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-2">
                    ARS
                  </span>
                  <span className="rounded-full border border-mint-500/30 bg-mint-500/10 px-3 py-2 text-mint-500">
                    4 miembros
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="font-display text-[clamp(2.4rem,5vw,5rem)] font-black leading-none text-ink-50">
              Cada gasto tiene contexto.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-ink-300">
              La app está pensada para momentos reales: alguien pagó, otros participaron, el grupo
              necesita seguir.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <article
              data-visual-card
              className="surface-glow overflow-hidden rounded-xl border border-obsidian-300 bg-obsidian-100 p-5"
            >
              <div className="rounded-lg border border-obsidian-300 bg-obsidian-0 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-3xl font-black text-ink-50">Cena puerto</p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                      Viernes · 22:14
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-bold text-mint-500">$48.200</span>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-obsidian-300 bg-obsidian-100 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      Pagó
                    </p>
                    <p className="mt-2 font-display text-xl font-bold text-ink-50">Sofi</p>
                  </div>
                  <div className="rounded-lg border border-obsidian-300 bg-obsidian-100 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      Participan
                    </p>
                    <p className="mt-2 font-display text-xl font-bold text-ink-50">4 personas</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    ["Sofi", "Pagó", "+$36.150", "text-mint-500"],
                    ["Martín", "Parte", "-$12.050", "text-rose-500"],
                    ["Juli", "Parte", "-$12.050", "text-rose-500"],
                  ].map(([name, status, amount, color]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-lg border border-obsidian-300 bg-obsidian-100 px-4 py-3"
                    >
                      <div>
                        <p className="font-display text-sm font-bold text-ink-50">{name}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                          {status}
                        </p>
                      </div>
                      <span className={`font-mono text-base font-bold ${color}`}>{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <div className="grid gap-4">
              {contextItems.map((item) => (
                <article
                  key={item.title}
                  data-visual-card
                  className="surface-glow group rounded-xl border border-obsidian-300 bg-obsidian-100 p-5 transition hover:border-lime-500"
                >
                  <div className="flex items-center justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200 text-lime-500 transition duration-700 ease-out group-hover:scale-105">
                        <item.icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-black text-ink-50">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-ink-300">{item.text}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-mint-500">{item.amount}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                        {item.status}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              <div className="rounded-xl border border-dashed border-obsidian-400 p-5">
                <p className="font-display text-lg font-bold text-ink-50">
                  Todo queda trazable sin frenar al grupo.
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-300">
                  El detalle está cuando hace falta; el resumen sigue siendo simple.
                  </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-obsidian-300 bg-obsidian-100 py-6">
        <div className="marquee flex whitespace-nowrap font-display text-5xl font-black uppercase tracking-normal text-lime-500/80">
          <span>gastos compartidos · viajes · grupos · saldos claros · liquidación simple · </span>
          <span aria-hidden="true">
            gastos compartidos · viajes · grupos · saldos claros · liquidación simple ·
          </span>
        </div>
      </section>

      <footer className="px-5 py-24 sm:px-8 md:py-32 lg:px-12">
        <div className="surface-glow mx-auto max-w-6xl rounded-xl border border-obsidian-300 bg-lime-500 p-8 text-obsidian-0 sm:p-12 lg:p-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl font-display text-[clamp(2.8rem,6vw,6rem)] font-black leading-[0.9] tracking-normal">
                Empezá con tu próximo grupo.
              </h2>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-obsidian-0/78">
                Dividir gastos compartidos en viajes puede ser simple desde el primer pago.
              </p>
            </div>
            <a
              href={appUrl}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-obsidian-0 px-6 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-ink-50 transition hover:bg-obsidian-200 focus:outline-none focus:ring-2 focus:ring-obsidian-0 focus:ring-offset-2 focus:ring-offset-lime-500"
            >
              Ir a la app
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroMockup() {
  return (
    <div data-hero-mock className="relative mx-auto w-full max-w-[390px] lg:mr-0">
      <div className="absolute -left-8 top-12 hidden h-24 w-24 rounded-full border border-lime-500/40 bg-lime-500/10 blur-sm sm:block" />
      <div className="surface-glow relative overflow-hidden rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="rounded-[22px] border border-obsidian-300 bg-obsidian-0 p-5">
          <div className="mb-8 flex items-center justify-between">
            <Wallet className="size-6 text-lime-500" />
            <span className="font-display text-lg font-black text-lime-500">DIVIDIR</span>
            <div className="flex size-9 items-center justify-center rounded-full border border-obsidian-300">
              <Plus className="size-4 text-ink-500" />
            </div>
          </div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-ink-500">
            Viaje a Ibiza 2024
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-mono text-5xl font-bold tracking-tight text-lime-500">
              +$652
            </span>
            <span className="pb-2 font-mono text-xs uppercase tracking-[0.16em] text-ink-500">
              ARS
            </span>
          </div>
          <div className="mt-8 space-y-3">
            {[
              ["Cena puerto", "$48.200", "Debe recibir"],
              ["Taxi aeropuerto", "$18.900", "Saldado"],
              ["Súper casa", "$33.100", "Debe pagar"],
            ].map(([title, amount, status]) => (
              <div
                key={title}
                className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-base font-bold text-ink-50">{title}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {status}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-bold text-mint-500">{amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({
  children,
  icon: Icon,
  title,
}: {
  children: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <article
      data-visual-card
      className="surface-glow group overflow-hidden rounded-xl border border-obsidian-300 bg-obsidian-100 p-6 transition hover:border-lime-500"
    >
      <div className="flex h-full flex-col justify-between gap-8">
        <div className="overflow-hidden rounded-lg bg-obsidian-200">
          <div className="flex min-h-20 items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(212,255,0,0.24),transparent_32%),radial-gradient(circle_at_70%_70%,rgba(0,255,157,0.14),transparent_35%)] transition-transform duration-700 ease-out group-hover:scale-105">
            <Icon className="size-8 text-lime-500" />
          </div>
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold text-ink-50">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-ink-300">{children}</p>
        </div>
      </div>
    </article>
  );
}

export default LandingScreen;
