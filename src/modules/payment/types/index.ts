import type { UserPlan } from 'generated/prisma/enums';

export type CheckoutMetadata = {
  userId: string;
  userPlan: UserPlan;
};
