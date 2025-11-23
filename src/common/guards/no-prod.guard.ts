import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../enums';

@Injectable()
export class NoProdGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(): boolean {
    if (
      this.configService.getOrThrow<Environment>('NODE_ENV') ===
      Environment.PROD
    ) {
      throw new ForbiddenException();
    }
    return true;
  }
}
