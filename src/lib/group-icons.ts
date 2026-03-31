import {
  Home,
  Plane,
  Ticket,
  type LucideIcon,
  UtensilsCrossed,
} from "lucide-react";

export const groupIconMap = {
  house: Home,
  plane: Plane,
  ticket: Ticket,
  utensils: UtensilsCrossed,
} satisfies Record<string, LucideIcon>;

export type GroupIconName = keyof typeof groupIconMap;
