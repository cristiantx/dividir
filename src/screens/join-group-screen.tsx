import { startTransition, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowLeft, LoaderCircle, Share2, Users2, Wallet } from "lucide-react";

import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "../hooks/use-group-data";
import { groupIconMap } from "../lib/group-icons";

export function JoinGroupScreen() {
  const { inviteToken } = useParams({ from: "/join/$inviteToken" });
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const joinViaInvite = useMutation(api.groups.joinViaInvite);
  const preview = useQuery(api.groups.invitePreview, { inviteToken });
  const { data: currentUser } = useCurrentUser(isAuthenticated);
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const signInStartedRef = useRef(false);

  useEffect(() => {
    if (!currentUser?.name?.trim()) {
      return;
    }

    setDisplayName((current) => current || currentUser.name!.trim());
  }, [currentUser?.name]);

  useEffect(() => {
    if (preview === undefined) {
      return;
    }

    if (preview.status === "invalid" || preview.status === "archived") {
      return;
    }

    if (isLoading || isAuthenticated || signInStartedRef.current) {
      return;
    }

    signInStartedRef.current = true;
    setIsSigningIn(true);
    setErrorMessage(null);
    setStatusMessage("Preparando acceso como invitado…");

    void signIn("anonymous")
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudo iniciar la sesión invitada.",
        );
      })
      .finally(() => {
        setIsSigningIn(false);
      });
  }, [isAuthenticated, isLoading, preview, signIn]);

  async function handleJoin() {
    if (!displayName.trim()) {
      setErrorMessage("Ingresa tu nombre para unirte.");
      return;
    }

    setIsJoining(true);
    setErrorMessage(null);
    setStatusMessage("Uniéndote al grupo…");

    try {
      const result = await joinViaInvite({
        displayName: displayName.trim(),
        inviteToken,
      });
      startTransition(() => {
        void navigate({
          params: { groupId: result.groupId },
          to: "/groups/$groupId",
        });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo completar la unión.");
      setStatusMessage(null);
    } finally {
      setIsJoining(false);
    }
  }

  if (preview === undefined) {
    return (
      <main className="app-grid app-screen-safe flex min-h-dvh flex-col bg-obsidian-0 text-ink-50">
        <section className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-8 text-center">
            <LoaderCircle className="mx-auto size-8 animate-spin text-lime-500" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-50">
              Revisando invitación
            </p>
            <p className="mt-2 text-sm text-ink-300">
              Cargando los datos del grupo para continuar.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (preview.status === "invalid") {
    return <InviteStateScreen body="La invitación ya no es válida." title="Enlace vencido" />;
  }

  const GroupIcon = groupIconMap[preview.icon];
  const isArchived = preview.status === "archived";
  const isRemoved = preview.status === "removed";
  const isJoined = preview.status === "joined";
  const isReady = preview.status === "ready";

  return (
    <main className="app-grid app-screen-safe flex min-h-dvh flex-col bg-obsidian-0 text-ink-50">
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-lime-500 transition hover:border-lime-500"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-lime-500" />
              <span className="font-display text-xl font-black tracking-tight text-lime-500">
                DIVIDIR
              </span>
            </div>
            <span className="w-10" />
          </div>

          <div className="rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-obsidian-400 bg-obsidian-200">
                <GroupIcon className="size-6 text-lime-500" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime-500">
                  Invitación activa
                </p>
                <h1 className="mt-3 break-words font-display text-3xl font-bold tracking-tight text-ink-50">
                  {preview.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">
                  <span>{preview.currencyCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users2 className="size-3.5" />
                    {preview.memberCount} participantes
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-obsidian-300 bg-obsidian-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-500/10 text-lime-500">
                  <Share2 className="size-4" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-ink-50">
                    {isArchived
                      ? "Este grupo ya fue archivado."
                      : isRemoved
                        ? "Tu acceso fue revocado."
                        : isJoined
                          ? "Ya estás dentro del grupo."
                          : "Entrarás con permisos de edición."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-300">
                    {isArchived
                      ? "El historial sigue existiendo, pero ya no acepta nuevas invitaciones."
                      : isRemoved
                        ? "El owner te quitó del grupo y este enlace ya no te permite volver a entrar."
                        : isJoined
                          ? "Abre el grupo para seguir cargando gastos, liquidaciones o editar sus datos."
                          : "Podrás editar el grupo y registrar gastos o liquidaciones, pero no invitar gente, quitar miembros ni archivar."}
                  </p>
                </div>
              </div>
            </div>

            {isReady ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="invite-display-name"
                    className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500"
                  >
                    Tu nombre en el grupo
                  </label>
                  <input
                    id="invite-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Cómo te verá el grupo"
                    className="mt-3 w-full rounded-2xl border border-obsidian-300 bg-obsidian-0 px-4 py-4 font-display text-base font-semibold text-ink-50 outline-none transition focus:border-lime-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isLoading || isSigningIn || isJoining}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-lime-500 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-obsidian-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningIn || isLoading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Preparando acceso
                    </>
                  ) : isJoining ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Uniéndote
                    </>
                  ) : (
                    "Unirme al grupo"
                  )}
                </button>
              </div>
            ) : null}

            {isJoined ? (
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    void navigate({
                      params: { groupId: preview.groupId },
                      to: "/groups/$groupId",
                    });
                  })
                }
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-lime-500 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-obsidian-0"
              >
                Abrir grupo
              </button>
            ) : null}

            {statusMessage ? (
              <p className="mt-5 rounded-2xl border border-lime-500/20 bg-lime-500/10 px-4 py-3 text-sm text-lime-400">
                {statusMessage}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function InviteStateScreen({ body, title }: { body: string; title: string }) {
  return (
    <main className="app-grid app-screen-safe flex min-h-dvh flex-col bg-obsidian-0 text-ink-50">
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[28px] border border-obsidian-300 bg-obsidian-100 p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime-500">
            Invitación
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-50">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-300">{body}</p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-obsidian-300 px-5 py-3 font-display text-sm font-semibold text-ink-50 transition hover:border-lime-500 hover:text-lime-500"
          >
            Volver
          </Link>
        </div>
      </section>
    </main>
  );
}
