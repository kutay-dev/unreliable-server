import { HttpStatus } from '@nestjs/common';

export type JwtPayload = {
  sub: string;
  username: string;
};

export type ErrorResponse = {
  success: boolean;
  message: string;
  errorCode: string | undefined;
  statusCode: HttpStatus;
  timestamp: string;
  path: string;
};
