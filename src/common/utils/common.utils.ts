export const generateRandomComplexString = (length: number) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?$@+*&';
  let complexString = '';
  for (let i = 0; i < length; i++) {
    complexString += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return complexString;
};

export const noNulls = <T extends object>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null),
  ) as T;
};
