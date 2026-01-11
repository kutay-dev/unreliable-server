import type { UserPlan } from 'generated/prisma/enums';

export type CheckoutMetadata = {
  userId: string;
  userPlan: UserPlan;
  amount?: number;
};

export type PaymentHandler = (ctx: {
  userId: string;
  amount: number;
}) => Promise<void>;
