import { UserPlan } from 'generated/prisma/enums';
import { StaticProduct } from '../types';

export const DB_CHUNK_SIZE = 32000;

export const PRODUCTS: StaticProduct = {
  PLUS: {
    id: '1cafed22-f1a8-4fa0-8836-3669ea2c4b7f',
    name: 'Unreliable Plus',
    content: UserPlan.PLUS,
    price: 5 * 100,
  },
  PRO: {
    id: 'de245208-f7c4-4d50-bbf4-d14ba9bd6c30',
    name: 'Unreliable Pro',
    content: UserPlan.PRO,
    price: 10 * 100,
  },
  CREDIT: {
    id: '7fa9aa73-a56a-4b3b-bd5d-01af4fc4ba89',
    name: 'Unreliable Credit',
    price: 0.5 * 100,
  },
} as const;
