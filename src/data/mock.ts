export type MockGroup = {
  id: string;
  icon: "plane" | "house" | "utensils" | "ticket";
  memberCount: number;
  name: string;
  netAmountMinor: number;
  statusLabel: "Te deben" | "Debes" | "Saldado";
};

export type MockMember = {
  id: string;
  name: string;
  avatarUrl: string;
  balanceMinor: number;
  isOwner?: boolean;
};

export type MockExpense = {
  id: string;
  amountMinor: number;
  paidBy: string;
  title: string;
  when: string;
};

export const mockGroups: MockGroup[] = [
  {
    id: "ibiza-2024",
    icon: "plane",
    memberCount: 4,
    name: "Viaje a Ibiza 2024",
    netAmountMinor: 84000,
    statusLabel: "Te deben",
  },
  {
    id: "piso",
    icon: "house",
    memberCount: 3,
    name: "Gastos Piso",
    netAmountMinor: -12550,
    statusLabel: "Debes",
  },
  {
    id: "cumple-pablo",
    icon: "utensils",
    memberCount: 8,
    name: "Cena Cumple Pablo",
    netAmountMinor: 0,
    statusLabel: "Saldado",
  },
  {
    id: "primavera",
    icon: "ticket",
    memberCount: 2,
    name: "Entradas Primavera",
    netAmountMinor: 22000,
    statusLabel: "Te deben",
  },
];

export const mockMembers: Record<string, MockMember[]> = {
  "ibiza-2024": [
    {
      id: "yo",
      name: "Yo",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
      balanceMinor: 48200,
      isOwner: true,
    },
    {
      id: "ana",
      name: "Ana",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
      balanceMinor: -13800,
    },
    {
      id: "carlos",
      name: "Carlos",
      avatarUrl:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
      balanceMinor: -18950,
    },
    {
      id: "elena",
      name: "Elena",
      avatarUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
      balanceMinor: -15450,
    },
  ],
};

export const mockExpenses: Record<string, MockExpense[]> = {
  "ibiza-2024": [
    {
      id: "exp-1",
      title: "Reserva del apartamento",
      paidBy: "Yo",
      when: "Hoy · 14:20",
      amountMinor: 120000,
    },
    {
      id: "exp-2",
      title: "Cena frente al puerto",
      paidBy: "Ana",
      when: "Ayer · 22:45",
      amountMinor: 46800,
    },
    {
      id: "exp-3",
      title: "Taxi al aeropuerto",
      paidBy: "Carlos",
      when: "Ayer · 09:10",
      amountMinor: 22400,
    },
  ],
};

export const mockSuggestedTransfers = {
  "ibiza-2024": {
    amountMinor: 124050,
    fromMemberId: "yo",
    methodHandle: "@marcos-ruiz-99",
    toMemberId: "carlos",
  },
};
