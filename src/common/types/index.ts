import { HttpStatus } from '@nestjs/common';
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
