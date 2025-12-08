import { HttpStatus } from '@nestjs/common';
import { Message } from 'generated/prisma/client';
import { Server, Socket } from 'socket.io';
import { FromCache } from '../enums';

export type JwtPayload = {
  sub: string;
  username: string;
};

export interface ISuccessResponse {
  success: boolean;
  data: any;
  totalCount?: number;
  fromCache?: FromCache;
}

export interface IErrorResponse {
  success: boolean;
  message: string;
  errorCode: string | undefined;
  statusCode: HttpStatus;
  timestamp: string;
  path: string;
}

export interface IEmitToRoomProps {
  client: Socket;
  server: Server;
  chatId: string;
  socket: string;
  payload: any;
}

export type MessageWithCosineSimilarity = Message & {
  cosine_similarity: number;
};
