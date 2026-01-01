import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtGuard } from '@/common/guards/jwt.guard';
import type { RawBodyRequest } from '@nestjs/common';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from 'generated/prisma/client';
import { CreateCheckoutDto } from './dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtGuard)
  @Post('create-checkout')
  createCheckout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.createCheckout(createCheckoutDto, user);
  }

  @Post('webhook')
  @HttpCode(202)
  async webhook(@Req() req: RawBodyRequest<Request>) {
    await this.paymentService.webhook(req);
  }
}
