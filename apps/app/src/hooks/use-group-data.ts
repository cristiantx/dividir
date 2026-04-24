import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { localDb } from "../lib/local-db";

type GroupSummaries = FunctionReturnType<typeof api.groups.list>;
type ArchivedGroupSummaries = FunctionReturnType<typeof api.groups.listArchived>;
type GroupDetail = FunctionReturnType<typeof api.groups.detail>;
type CurrentUser = FunctionReturnType<typeof api.users.current>;
type NormalizedGroupDetail = Exclude<GroupDetail, null>;

const defaultGroupPermissions = {
  canArchiveGroup: false,
  canDeleteGroup: false,
  canEditGroup: false,
  canManageInvite: false,
  canManageMembers: false,
  canUnarchiveGroup: false,
} as const;

function parseCachedPayload<T>(payload?: string | null) {
  if (!payload) {
    return null;
  }
  return JSON.parse(payload) as T;
}

function normalizeGroupDetail(data: GroupDetail): GroupDetail {
  if (data === null) {
    return null;
  }

  const movements =
    "movements" in data && Array.isArray((data as { movements?: unknown }).movements)
      ? data.movements
      : data.recentExpenses?.map((expense) => ({
          amountMinor: expense.amountMinor,
          expenseId: expense.expenseId,
          kind: "expense" as const,
          occurredAt: expense.spentAt,
          paidBy: expense.paidBy,
          title: expense.title,
        })) ?? [];

  return {
    ...data,
    movements,
    permissions: data.permissions ?? defaultGroupPermissions,
    viewerRole: data.viewerRole ?? "member",
  } satisfies NormalizedGroupDetail;
}

export function useGroupSummaries(enabled = true) {
  const liveData = useQuery(api.groups.list, enabled ? {} : "skip");
  const cachedRecord = useLiveQuery(() => localDb.cachedGroups.get("all"), [], undefined);
  const cachedData = parseCachedPayload<GroupSummaries>(cachedRecord?.payload);

  useEffect(() => {
    if (liveData === undefined) {
      return;
    }

    void localDb.cachedGroups.put({
      id: "all",
      payload: JSON.stringify(liveData),
      updatedAt: Date.now(),
    });
  }, [liveData]);

  return {
    data: liveData ?? cachedData ?? [],
    isCached: liveData === undefined && cachedData !== null,
    isLoading: enabled && liveData === undefined && cachedData === null,
  };
}

export function useArchivedGroupSummaries(enabled = true) {
  const liveData = useQuery(api.groups.listArchived, enabled ? {} : "skip");
  const cachedRecord = useLiveQuery(() => localDb.cachedGroups.get("archived"), [], undefined);
  const cachedData = parseCachedPayload<ArchivedGroupSummaries>(cachedRecord?.payload);

  useEffect(() => {
    if (liveData === undefined) {
      return;
    }

    void localDb.cachedGroups.put({
      id: "archived",
      payload: JSON.stringify(liveData),
      updatedAt: Date.now(),
    });
  }, [liveData]);

  return {
    data: liveData ?? cachedData ?? [],
    isCached: liveData === undefined && cachedData !== null,
    isLoading: enabled && liveData === undefined && cachedData === null,
  };
}

export function useGroupDetail(groupId: Id<"groups"> | null, enabled = true) {
  const liveData = useQuery(api.groups.detail, enabled && groupId ? { groupId } : "skip");
  const cachedRecord = useLiveQuery(
    () => (groupId ? localDb.cachedGroupDetails.get(groupId) : undefined),
    [groupId],
    undefined,
  );
  const cachedData = normalizeGroupDetail(parseCachedPayload<GroupDetail>(cachedRecord?.payload));

  useEffect(() => {
    if (!groupId || liveData === undefined) {
      return;
    }

    void localDb.cachedGroupDetails.put({
      id: groupId,
      payload: JSON.stringify(liveData),
      updatedAt: Date.now(),
    });
  }, [groupId, liveData]);

  return {
    data: liveData === undefined ? cachedData ?? null : normalizeGroupDetail(liveData),
    isCached: liveData === undefined && cachedData !== null,
    isLoading: enabled && groupId !== null && liveData === undefined && cachedData === null,
  };
}

export function useCurrentUser(enabled = true) {
  const liveData = useQuery(api.users.current, enabled ? {} : "skip");
  const cachedRecord = useLiveQuery(() => localDb.cachedCurrentUser.get("current"), [], undefined);
  const cachedData = parseCachedPayload<CurrentUser>(cachedRecord?.payload);

  useEffect(() => {
    if (liveData === undefined) {
      return;
    }

    void localDb.cachedCurrentUser.put({
      id: "current",
      payload: JSON.stringify(liveData),
      updatedAt: Date.now(),
    });
  }, [liveData]);

  return {
    data: liveData ?? cachedData ?? null,
    isCached: liveData === undefined && cachedData !== null,
    isLoading: enabled && liveData === undefined && cachedData === null,
  };
}
