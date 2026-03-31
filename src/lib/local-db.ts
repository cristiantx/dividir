import Dexie, { type EntityTable } from "dexie";

export type CachedGroupSummary = {
  id: string;
  payload: string;
  updatedAt: number;
};

export type CachedGroupDetail = {
  id: string;
  payload: string;
  updatedAt: number;
};

export type QueuedMutation = {
  id: string;
  mutationName: string;
  payload: string;
  status: "pending" | "processing" | "failed";
  attempts: number;
  createdAt: number;
  updatedAt: number;
};

class DividirDatabase extends Dexie {
  cachedGroups!: EntityTable<CachedGroupSummary, "id">;
  cachedGroupDetails!: EntityTable<CachedGroupDetail, "id">;
  queuedMutations!: EntityTable<QueuedMutation, "id">;

  constructor() {
    super("dividir");
    this.version(1).stores({
      cachedGroups: "id, updatedAt",
      cachedGroupDetails: "id, updatedAt",
      queuedMutations: "id, mutationName, status, updatedAt",
    });
  }
}

export const localDb = new DividirDatabase();
