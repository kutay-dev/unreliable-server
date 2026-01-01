import { UserPlan } from 'generated/prisma/enums';

export const DB_CHUNK_SIZE = 32000;

export const PRODUCTS = {
  PLUS: {
    name: 'Unreliable Plus',
    plan: UserPlan.PLUS,
    productId: '1cafed22-f1a8-4fa0-8836-3669ea2c4b7f',
  },
  PRO: {
    name: 'Unreliable Pro',
    plan: UserPlan.PRO,
    productId: 'de245208-f7c4-4d50-bbf4-d14ba9bd6c30',
  },
} as const;
