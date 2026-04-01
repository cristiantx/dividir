import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function ensureDemoData(ctx: MutationCtx, userId: Id<"users">) {
  const existingGroup = await ctx.db
    .query("groups")
    .withIndex("by_creator", (query) => query.eq("createdByUserId", userId))
    .first();

  if (existingGroup !== null) {
    return;
  }

  const now = Date.now();
  const groupId = await ctx.db.insert("groups", {
    name: "Viaje a Ibiza 2024",
    currencyCode: "ARS",
    createdByUserId: userId,
    description: "Grupo demo inicial",
    icon: "plane",
  });

  const meId = await ctx.db.insert("groupMembers", {
    groupId,
    displayName: "Yo",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    joinedAt: now,
    linkedUserId: userId,
    role: "owner",
    source: "owner",
    status: "active",
  });

  const anaId = await ctx.db.insert("groupMembers", {
    groupId,
    displayName: "Ana",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    joinedAt: now,
    inviteUuid: crypto.randomUUID(),
    role: "member",
    source: "local",
    status: "active",
  });

  const carlosId = await ctx.db.insert("groupMembers", {
    groupId,
    displayName: "Carlos",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
    joinedAt: now,
    inviteUuid: crypto.randomUUID(),
    role: "member",
    source: "local",
    status: "active",
  });

  const elenaId = await ctx.db.insert("groupMembers", {
    groupId,
    displayName: "Elena",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    joinedAt: now,
    inviteUuid: crypto.randomUUID(),
    role: "member",
    source: "local",
    status: "active",
  });

  const apartmentExpenseId = await ctx.db.insert("expenses", {
    groupId,
    title: "Reserva del apartamento",
    amountMinor: BigInt(120000),
    currencyCode: "ARS",
    paidByMemberId: meId,
    splitMethod: "equal",
    createdByUserId: userId,
    spentAt: now - 1000 * 60 * 60 * 5,
    createdAt: now - 1000 * 60 * 60 * 5,
  });

  for (const memberId of [meId, anaId, carlosId, elenaId]) {
    await ctx.db.insert("expenseShares", {
      expenseId: apartmentExpenseId,
      memberId,
      amountMinor: BigInt(30000),
    });
  }

  const dinnerExpenseId = await ctx.db.insert("expenses", {
    groupId,
    title: "Cena frente al puerto",
    amountMinor: BigInt(46800),
    currencyCode: "ARS",
    paidByMemberId: anaId,
    splitMethod: "equal",
    createdByUserId: userId,
    spentAt: now - 1000 * 60 * 60 * 24,
    createdAt: now - 1000 * 60 * 60 * 24,
  });

  for (const memberId of [meId, anaId, carlosId]) {
    await ctx.db.insert("expenseShares", {
      expenseId: dinnerExpenseId,
      memberId,
      amountMinor: BigInt(15600),
    });
  }

  const taxiExpenseId = await ctx.db.insert("expenses", {
    groupId,
    title: "Taxi al aeropuerto",
    amountMinor: BigInt(22400),
    currencyCode: "ARS",
    paidByMemberId: carlosId,
    splitMethod: "equal",
    createdByUserId: userId,
    spentAt: now - 1000 * 60 * 60 * 30,
    createdAt: now - 1000 * 60 * 60 * 30,
  });

  for (const memberId of [meId, carlosId]) {
    await ctx.db.insert("expenseShares", {
      expenseId: taxiExpenseId,
      memberId,
      amountMinor: BigInt(11200),
    });
  }

  await ctx.db.insert("settlements", {
    groupId,
    fromMemberId: anaId,
    toMemberId: meId,
    amountMinor: BigInt(4200),
    currencyCode: "ARS",
    createdByUserId: userId,
    settledAt: now - 1000 * 60 * 60 * 12,
  });

  const housingGroupId = await ctx.db.insert("groups", {
    name: "Gastos Piso",
    currencyCode: "ARS",
    createdByUserId: userId,
    icon: "house",
  });

  await ctx.db.insert("groupMembers", {
    groupId: housingGroupId,
    displayName: "Yo",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    joinedAt: now,
    linkedUserId: userId,
    role: "owner",
    source: "owner",
    status: "active",
  });
}
