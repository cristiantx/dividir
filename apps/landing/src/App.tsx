import { useEffect } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Luggage,
  ReceiptText,
  Sparkles,
  UsersRound,
} from "lucide-react";

import heroImage from "./assets/hero.png";

const highlights = [
  {
    icon: ReceiptText,
    title: "Gastos claros",
    text: "Cada pago queda con quién puso, quién participa y cuánto le toca a cada persona.",
  },
  {
    icon: UsersRound,
    title: "Grupos de viaje",
    text: "Un espacio compartido para alojamiento, comidas, traslados y planes del grupo.",
  },
  {
    icon: CircleDollarSign,
    title: "Cierre simple",
    text: "Balances listos para saber quién paga a quién cuando termina el viaje.",
  },
];

const appUrl = "https://go.dividir.app/groups";
const loginUrl = "https://go.dividir.app/login";

export function LandingScreen() {
  useEffect(() => {
    document.title = "Dividir - Gastos compartidos para viajes";
  }, []);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f7f0df] text-[#20170f]">
      <section className="relative min-h-[92dvh] px-5 py-5 sm:px-8 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#ff7a59,#f6c85f,#56c6a5,#6272ff)]" />

        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-4">
          <a href="/" className="font-headline text-2xl font-bold tracking-normal">
            Dividir
          </a>
          <a
            href={loginUrl}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#20170f]/15 bg-white/55 px-4 text-sm font-bold text-[#20170f] shadow-[0_6px_18px_rgba(32,23,15,0.08)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#20170f] focus:ring-offset-2 focus:ring-offset-[#f7f0df]"
          >
            Abrir app
          </a>
        </nav>

        <div className="mx-auto grid max-w-6xl items-center gap-10 pb-10 pt-8 lg:min-h-[calc(92dvh-6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-16 lg:pt-4">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#20170f]/12 bg-white/55 px-3 py-2 text-sm font-bold text-[#4f3a23] shadow-[0_8px_22px_rgba(32,23,15,0.08)]">
              <Luggage className="size-4 text-[#ff7a59]" />
              Para viajes, casas compartidas y escapadas
            </div>

            <h1 className="font-headline text-[clamp(3.6rem,11vw,8.75rem)] font-bold leading-[0.82] tracking-normal text-[#20170f]">
              Dividir
            </h1>
            <p className="mt-7 max-w-2xl text-[clamp(1.2rem,2.6vw,2rem)] font-semibold leading-tight text-[#4f3a23]">
              La forma simple de llevar gastos compartidos sin convertir el viaje en una planilla.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={appUrl}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#20170f] px-6 text-base font-bold text-[#fff9ea] shadow-[0_16px_34px_rgba(32,23,15,0.22)] transition hover:-translate-y-0.5 hover:bg-[#352417] focus:outline-none focus:ring-2 focus:ring-[#20170f] focus:ring-offset-2 focus:ring-offset-[#f7f0df]"
              >
                Empezar
                <ArrowRight className="size-5" />
              </a>
              <a
                href="#como-funciona"
                className="inline-flex h-14 items-center justify-center rounded-full border border-[#20170f]/15 bg-white/55 px-6 text-base font-bold text-[#20170f] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#20170f] focus:ring-offset-2 focus:ring-offset-[#f7f0df]"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[420px]">
            <div className="absolute -left-8 top-8 hidden rounded-3xl bg-[#56c6a5] px-5 py-4 text-[#123127] shadow-[0_20px_40px_rgba(32,23,15,0.16)] sm:block">
              <p className="font-mono text-sm font-bold">+ 3 gastos</p>
              <p className="text-sm font-semibold">Cena, taxi, súper</p>
            </div>
            <div className="absolute -right-5 bottom-12 z-10 rounded-3xl bg-[#f6c85f] px-5 py-4 text-[#3d2b12] shadow-[0_20px_40px_rgba(32,23,15,0.16)]">
              <p className="font-mono text-sm font-bold">$0 estrés</p>
              <p className="text-sm font-semibold">Todo balanceado</p>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-[#20170f]/12 bg-[#20170f] p-3 shadow-[0_30px_80px_rgba(32,23,15,0.28)]">
              <img
                src={heroImage}
                alt="Vista móvil de Dividir con un resumen de gastos compartidos."
                className="aspect-[343/361] w-full rounded-[1.35rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-[#20170f]/10 bg-[#fff9ea] px-5 py-16 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="mb-5 inline-flex size-12 items-center justify-center rounded-full bg-[#ff7a59] text-white">
              <Sparkles className="size-6" />
            </div>
            <h2 className="font-headline text-[clamp(2rem,5vw,4.8rem)] font-bold leading-[0.92] tracking-normal">
              Menos cuentas pendientes.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:pt-2">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.4rem] border border-[#20170f]/10 bg-[#f7f0df] p-5 shadow-[0_10px_28px_rgba(32,23,15,0.07)]"
              >
                <item.icon className="mb-6 size-6 text-[#ff7a59]" />
                <h3 className="font-headline text-xl font-bold tracking-normal">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5d4933]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#20170f] px-5 py-12 text-[#fff9ea] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BadgeCheck className="mb-4 size-7 text-[#56c6a5]" />
            <h2 className="font-headline text-3xl font-bold tracking-normal sm:text-4xl">
              Listo para el próximo grupo.
            </h2>
          </div>
          <a
            href={appUrl}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#fff9ea] px-6 font-bold text-[#20170f] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#fff9ea] focus:ring-offset-2 focus:ring-offset-[#20170f]"
          >
            Ir a go.dividir.app
            <ArrowRight className="size-5" />
          </a>
        </div>
      </section>
    </main>
  );
}

export default LandingScreen;
