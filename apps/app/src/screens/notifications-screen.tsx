import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";

import { api } from "../../convex/_generated/api";
import { formatExpenseTimestamp, formatMoney } from "../lib/formatters";
import { ScreenFrame } from "../components/screen-frame";

export function NotificationsScreen() {
  const notifications = useQuery(api.notifications.listUnread, {});
  const markNotificationRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  async function handleMarkAllRead() {
    await markAllRead();
  }

  async function handleOpenNotification(notificationId: string) {
    await markNotificationRead({ notificationId: notificationId as any });
  }

  return (
    <ScreenFrame
      inset="tabs"
      headerStart={
        <Link
          to="/groups"
          viewTransition={{ types: ["notifications-close"] }}
          aria-label="Volver a grupos"
          className="inline-flex size-10 items-center justify-center rounded-full border border-obsidian-300 text-lime-500 transition hover:border-lime-500"
        >
          <ArrowLeft className="size-4" />
        </Link>
      }
      headerCenter={
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-lime-500" />
          <h1 className="font-display text-xl font-black tracking-tight text-lime-500">
            Notificaciones
          </h1>
        </div>
      }
      headerEnd={
        notifications && notifications.length > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="inline-flex items-center gap-2 rounded-full border border-obsidian-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-300 transition hover:border-lime-500 hover:text-lime-500"
          >
            <CheckCheck className="size-4" />
            Leer todo
          </button>
        ) : (
          <span className="w-10" />
        )
      }
      contentClassName="px-6 pt-8"
    >
      {!notifications ? (
        <div className="surface-glow rounded-xl border border-obsidian-300 bg-obsidian-100 p-5 text-center text-ink-300">
          Cargando notificaciones...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-obsidian-300 bg-obsidian-100 p-6 text-center">
          <p className="font-display text-lg font-semibold text-ink-50">Todo al día</p>
          <p className="mt-2 text-sm leading-6 text-ink-300">
            Cuando alguien agregue un gasto o una liquidación en la que participes, aparecerá
            aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.notificationId}
              to="/groups/$groupId"
              params={{ groupId: notification.groupId }}
              onClick={() => void handleOpenNotification(notification.notificationId)}
              className="block rounded-2xl border border-obsidian-300 bg-obsidian-100 p-4 transition hover:border-lime-500/40 hover:bg-obsidian-50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-500/10 text-lime-500">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-ink-50">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-300">{notification.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-500">
                    <span>{notification.groupName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatExpenseTimestamp(notification.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatMoney(Number(notification.amountMinor), notification.currencyCode)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ScreenFrame>
  );
}
