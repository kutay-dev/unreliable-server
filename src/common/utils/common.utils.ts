import { WORDS } from '../constants/words';

export const generateRandomComplexString = (length: number) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?$@+*&';
  let complexString = '';
  for (let i = 0; i < length; i++) {
    complexString += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return complexString;
};

export const getRandomSentence = () => {
  return Array.from({ length: Math.floor(Math.random() * 10) + 2 })
    .map(() => WORDS[Math.floor(Math.random() * WORDS.length)])
    .join(' ');
};

export const noNulls = <T extends object>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null),
  ) as T;
};
