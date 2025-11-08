import { WORDS } from '../constants/words';
import { Environment } from '../enums';
import { IEmitToRoomProps } from '../types';

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

export const emitToRoom = (emitProps: IEmitToRoomProps) => {
  if (process.env.NODE_ENV === Environment.PROD) {
    emitProps.client.broadcast
      .to(`chat:${emitProps.chatId}`)
      .emit(emitProps.socket, emitProps.payload);
  } else {
    emitProps.server
      .to(`chat:${emitProps.chatId}`)
      .emit(emitProps.socket, emitProps.payload);
  }
};
