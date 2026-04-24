import type { Doc, Id } from "../_generated/dataModel";

export type ComputedBalance = {
  memberId: Id<"groupMembers">;
  amountMinor: number;
};

export function computeBalances(args: {
  expenseShares: Doc<"expenseShares">[];
  expenses: Doc<"expenses">[];
  members: Doc<"groupMembers">[];
  settlements: Doc<"settlements">[];
}) {
  const balances = new Map<Id<"groupMembers">, number>();

  for (const member of args.members) {
    balances.set(member._id, 0);
  }

  for (const expense of args.expenses) {
    balances.set(
      expense.paidByMemberId,
      (balances.get(expense.paidByMemberId) ?? 0) + Number(expense.amountMinor),
    );
  }

  for (const share of args.expenseShares) {
    balances.set(
      share.memberId,
      (balances.get(share.memberId) ?? 0) - Number(share.amountMinor),
    );
  }

  for (const settlement of args.settlements) {
    balances.set(
      settlement.fromMemberId,
      (balances.get(settlement.fromMemberId) ?? 0) - Number(settlement.amountMinor),
    );
    balances.set(
      settlement.toMemberId,
      (balances.get(settlement.toMemberId) ?? 0) + Number(settlement.amountMinor),
    );
  }

  return Array.from(balances.entries()).map(([memberId, amountMinor]) => ({
    memberId,
    amountMinor,
  }));
}

export function computeSuggestedTransfers(
  balances: ComputedBalance[],
): Array<{ amountMinor: number; fromMemberId: Id<"groupMembers">; toMemberId: Id<"groupMembers"> }> {
  const creditors = balances
    .filter((item) => item.amountMinor > 0)
    .map((item) => ({ ...item }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
  const debtors = balances
    .filter((item) => item.amountMinor < 0)
    .map((item) => ({ ...item }))
    .sort((a, b) => a.amountMinor - b.amountMinor);

  const transfers: Array<{
    amountMinor: number;
    fromMemberId: Id<"groupMembers">;
    toMemberId: Id<"groupMembers">;
  }> = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amountMinor = Math.min(creditor.amountMinor, Math.abs(debtor.amountMinor));

    transfers.push({
      amountMinor,
      fromMemberId: debtor.memberId,
      toMemberId: creditor.memberId,
    });

    creditor.amountMinor -= amountMinor;
    debtor.amountMinor += amountMinor;

    if (creditor.amountMinor === 0) {
      creditorIndex += 1;
    }
    if (debtor.amountMinor === 0) {
      debtorIndex += 1;
    }
  }

  return transfers;
}
