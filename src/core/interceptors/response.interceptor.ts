import { Environment } from '@/common/enums';
import { ISuccessResponse } from '@/common/types';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    const isProd = process.env.NODE_END === Environment.PROD;

    return next.handle().pipe(
      map((data) => {
        const res: ISuccessResponse = {
          success: true,
          data: data?.data ?? data,
        };

        if (!isProd) {
          if (data?.fromCache !== undefined) {
            res.fromCache = data.fromCache;
          }
          if (Array.isArray(data?.data ?? data)) {
            res.totalCount = data?.data.length ?? data.length;
          }
        }
        return res;
      }),
    );
  }
}
