import { CURRENCY, type Plan, type Role } from "./site";

// Prices and limits are enforced in the database (change_plan_test and the
// jobs/applications triggers). If you change a number here, change it there.
export interface PlanInfo {
  id: Plan;
  name: string;
  price: number; // per month, in CURRENCY
  features: string[];
}

export const MONTHLY_LIMIT: Record<Role, number | null> = {
  employer: 3, // job posts per month on Free
  worker: 5, // applications per month on Free
  volunteer: null,
};

export const PLANS: Record<Role, PlanInfo[]> = {
  employer: [
    { id: "free", name: "Free", price: 0, features: ["3 job posts per month", "Receive and manage applications"] },
    { id: "pro", name: "Pro", price: 30, features: ["Unlimited job posts", "Receive and manage applications"] },
  ],
  worker: [
    { id: "free", name: "Free", price: 0, features: ["5 applications per month", "Public profile with your skills"] },
    { id: "pro", name: "Pro", price: 10, features: ["Unlimited applications", "Public profile with your skills"] },
  ],
  volunteer: [
    { id: "free", name: "Free", price: 0, features: ["Join any volunteer job", "No limits, always free"] },
  ],
};

export function priceLabel(p: PlanInfo) {
  return p.price === 0 ? "Free" : `${p.price} ${CURRENCY} / month`;
}
