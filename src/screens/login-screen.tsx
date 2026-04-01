import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Mail, Wallet, Zap } from "lucide-react";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingGoogle, setIsSendingGoogle] = useState(false);
  const { isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  async function handleMagicLink() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail.includes("@")) {
      setErrorMessage("Ingresa un email válido.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage("Necesitas conexión para enviar un magic link.");
      return;
    }

    setIsSendingEmail(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const result = await signIn("resend", {
        email: normalizedEmail,
        redirectTo: "/groups",
      });

      setStatusMessage(
        result.signingIn
          ? "Sesión iniciada. Redirigiendo…"
          : "Revisa tu email y abre el magic link para entrar a Dividir.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setIsSendingEmail(false);
    }
  }

  async function handleGoogle() {
    setIsSendingGoogle(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await signIn("google", { redirectTo: "/groups" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo abrir Google.");
      setIsSendingGoogle(false);
    }
  }

  return (
    <main className="app-grid flex min-h-dvh flex-col bg-obsidian-0 text-ink-50">
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-16 flex flex-col items-center">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="size-9 text-lime-500" />
              <h1 className="font-display text-4xl font-black uppercase tracking-tight text-lime-500">
                DIVIDIR
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-4 bg-obsidian-400" />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
                Auth protocol v2.0
              </p>
              <span className="h-px w-4 bg-obsidian-400" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="ml-1 block font-mono text-[11px] uppercase tracking-[0.24em] text-ink-500"
              >
                Terminal_Input: Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  className="w-full border border-obsidian-300 bg-obsidian-100 px-4 py-4 font-mono text-sm text-lime-500 outline-none transition focus:border-lime-500"
                />
                <Mail className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-500/60" />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={isSendingEmail || isSendingGoogle || isLoading}
                className="flex w-full items-center justify-center gap-2 bg-lime-500 py-4 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-obsidian-0 shadow-[4px_4px_0px_0px_rgba(212,255,0,0.2)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingEmail ? "Enviando enlace" : "Enviar magic link"}
                <Zap className="size-4 fill-current" />
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-obsidian-300" />
                <span className="font-mono text-[10px] text-ink-500">OR</span>
                <div className="h-px flex-1 bg-obsidian-300" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={isSendingEmail || isSendingGoogle || isLoading}
                className="flex w-full items-center justify-center gap-3 border border-obsidian-300 bg-transparent py-4 font-display text-[14px] font-semibold text-ink-50 transition hover:bg-obsidian-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09A6.96 6.96 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11.95 11.95 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isSendingGoogle ? "Abriendo Google" : "Continuar con Google"}
              </button>
            </div>

            {statusMessage ? (
              <p className="rounded-[18px] border border-mint-500/30 bg-mint-500/10 px-4 py-3 text-sm text-mint-500">
                {statusMessage}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
                {errorMessage}
              </p>
            ) : null}

            <div className="text-center">
              <p className="font-mono text-[11px] leading-relaxed text-ink-500">
                ¿No tienes cuenta?{" "}
                <span className="cursor-pointer text-lime-500 hover:underline">
                  Activa una sesión con email o Google
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-obsidian-300/50 p-8">
        <div className="mx-auto flex max-w-md flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-mint-500" />
              <span className="font-mono text-[10px] uppercase tracking-tight text-ink-500">
                System status: Stable
              </span>
            </div>
            <p className="hidden font-mono text-[10px] text-ink-500/70 md:block">
              © 2026 DIVIDIR PROTOCOL
            </p>
          </div>
          <nav className="flex gap-8">
            <a href="#" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 hover:text-lime-500">
              Privacy
            </a>
            <a href="#" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 hover:text-lime-500">
              Terms
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
