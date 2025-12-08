import OpenAI from 'openai';
import { WORDS } from '../constants/words';
import { Environment } from '../enums';
import { IEmitToRoomProps } from '../types';

const aiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateRandomComplexString = (length: number): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?$@+*&';
  let complexString = '';
  for (let i = 0; i < length; i++) {
    complexString += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return complexString;
};

export const getRandomSentence = (): string => {
  return Array.from({ length: Math.floor(Math.random() * 10) + 2 })
    .map(() => WORDS[Math.floor(Math.random() * WORDS.length)])
    .join(' ');
};

export const noNulls = <T extends object>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null),
  ) as T;
};

export const emitToRoom = (emitProps: IEmitToRoomProps): void => {
  if (isProd) {
    emitProps.client.broadcast
      .to(`chat:${emitProps.chatId}`)
      .emit(emitProps.socket, emitProps.payload);
  } else {
    emitProps.server
      .to(`chat:${emitProps.chatId}`)
      .emit(emitProps.socket, emitProps.payload);
  }
};

export const isProd =
  (process.env.NODE_ENV as Environment) === Environment.PROD;

export const vectorize = async (data: string): Promise<string> => {
  const embedding = await aiClient.embeddings.create({
    model: 'text-embedding-3-large',
    input: data,
    dimensions: 1536,
  });
  const vector = embedding.data[0].embedding;
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  const normalizedVector = vector.map((v) => v / norm);
  return `[${normalizedVector.join(',')}]`;
};
