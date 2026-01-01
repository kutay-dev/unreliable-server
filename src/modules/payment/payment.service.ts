import { PRODUCTS } from '@/common/constants/common';
import { LoggerService } from '@/core/logger/logger.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Polar } from '@polar-sh/sdk';
import type { Order } from '@polar-sh/sdk/models/components/order.js';
import {
  WebhookVerificationError,
  validateEvent,
} from '@polar-sh/sdk/webhooks';
import type { Request } from 'express';
import type { User, UserPlan } from 'generated/prisma/client';
import { CreateCheckoutDto } from './dto';
import { CheckoutMetadata } from './types';
import { isProd } from '@/common/utils/common.utils';

@Injectable()
export class PaymentService {
  private polarClient: Polar;
  private clientUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setModuleName(PaymentService.name);
    this.polarClient = new Polar({
      accessToken: this.configService.getOrThrow<string>(
        isProd ? 'POLAR_ACCESS_TOKEN_PROD' : 'POLAR_ACCESS_TOKEN_SANDBOX',
      ),
      server: isProd ? 'production' : 'sandbox',
    });
    this.clientUrl = this.configService.getOrThrow<string>('CLIENT_URL');
  }

  async createCheckout(createCheckoutDto: CreateCheckoutDto, user: User) {
    const checkout = await this.polarClient.checkouts.create({
      products: [createCheckoutDto.productId],
      successUrl: `${this.clientUrl}/billing/success?checkout_id={CHECKOUT_ID}`,
      returnUrl: `${this.clientUrl}/plans`,
      metadata: <CheckoutMetadata>{
        userId: user.id,
        userPlan: user.plan,
      },
    });
    return {
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
    };
  }

  async webhook(req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not found');
    }
    try {
      const event = validateEvent(
        rawBody,
        req.headers as Record<string, string>,
        this.configService.getOrThrow<string>(
          isProd ? 'POLAR_WEBHOOK_SECRET_PROD' : 'POLAR_WEBHOOK_SECRET_SANDBOX',
        ),
      );
      this.logger.log(`Webhook event: ${event.type}`, event);
      if (event.type === 'order.paid') {
        const data = event.data;
        await this.processPurchase(data);
      }
    } catch (e) {
      if (e instanceof WebhookVerificationError) {
        this.logger.error('Invalid webhook signature', (e as Error).stack);
        throw new ForbiddenException('Invalid webhook signature');
      }
      this.logger.error('Webhook error', (e as Error).stack);
      throw e;
    }
  }

  private async processPurchase(orderData: Order) {
    const product = Object.values(PRODUCTS).find(
      (p) => p.productId === orderData.productId,
    );
    if (!product) {
      this.logger.error('Product not found ', orderData.productId as string);
      return;
    }
    const userId = orderData.metadata.userId as string;
    if (!userId) {
      this.logger.error('User ID not found in metadata', orderData.id);
      return;
    }
    await this.prisma.user.update({
      data: {
        plan: product.plan satisfies UserPlan,
      },
      where: {
        id: userId,
      },
    });
    this.logger.log(
      `Purchase completed +${(orderData.totalAmount / 100).toFixed(2)} ${orderData.currency.toUpperCase()} `,
      orderData,
    );
  }
}
