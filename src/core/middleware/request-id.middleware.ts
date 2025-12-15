import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import uuidv4 from '@/common/utils/uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, _: Response, next: NextFunction): void {
    (req as any).id = uuidv4();
    next();
  }
}
