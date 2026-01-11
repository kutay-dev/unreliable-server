import { PRODUCTS } from '@/common/constants/common';
import { isProd } from '@/common/utils/common.utils';
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
import { PaymentStatus, Prisma, User, UserPlan } from 'generated/prisma/client';
import { CreateCheckoutDto } from './dto';
import { CheckoutMetadata, PaymentHandler } from './types';

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

  async createCheckout(
    createCheckoutDto: CreateCheckoutDto,
    user: User,
  ): Promise<{ checkoutId: string; checkoutUrl: string }> {
    const { productId, amount } = createCheckoutDto;
    const checkout = await this.polarClient.checkouts.create({
      products: [productId],
      prices: amount
        ? {
            [productId]: [
              {
                amountType: 'fixed',
                priceAmount: PRODUCTS.CREDIT.price * amount,
                priceCurrency: 'usd',
              },
            ],
          }
        : undefined,
      successUrl: `${this.clientUrl}/billing/success?checkout_id={CHECKOUT_ID}`,
      returnUrl: `${this.clientUrl}/plans`,
      metadata: <CheckoutMetadata>{
        userId: user.id,
        userPlan: user.plan,
        amount: amount ?? 1,
      },
    });
    return {
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
    };
  }

  async webhook(req: RawBodyRequest<Request>): Promise<void> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not found');
    }
    try {
      const header = req.headers['webhook-id'];
      const eventId = Array.isArray(header)
        ? (header[0] ?? null)
        : typeof header === 'string'
          ? header
          : null;
      if (!eventId) {
        throw new BadRequestException('Missing webhook-id header');
      }
      const event = validateEvent(
        rawBody,
        req.headers as Record<string, string>,
        this.configService.getOrThrow<string>(
          isProd ? 'POLAR_WEBHOOK_SECRET_PROD' : 'POLAR_WEBHOOK_SECRET_SANDBOX',
        ),
      );
      this.logger.log(`Webhook event: ${event.type}`, event);
      try {
        await this.prisma.paymentEvent.create({
          data: {
            eventId,
            type: event.type,
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          this.logger.log('Duplicate webhook, ignored', {
            eventId,
            type: event.type,
          });
          return;
        }
        this.logger.error('Error writing payment event', (e as Error).stack);
        throw e;
      }
      if (event.type === 'order.paid') {
        const data = event.data;
        await this.processPurchase(data, { eventId });
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

  private async processPurchase(
    data: Order,
    metadata: Record<string, any>,
  ): Promise<void> {
    const product = Object.values(PRODUCTS).find(
      (p) => p.id === data.productId,
    );
    if (!product) {
      this.logger.error('Product not found ', data.productId as string);
      return;
    }
    const userId = data.metadata.userId as string;
    if (!userId) {
      this.logger.error('User ID not found in metadata', data.id);
      return;
    }
    await this.handlers[product.id]({
      userId,
      amount: +data.metadata.amount,
    });
    await this.prisma.payment.create({
      data: {
        eventId: metadata.eventId,
        userId,
        productId: data.productId as string,
        amount: data.totalAmount,
        currency: data.currency,
        status: PaymentStatus.SUCCEEDED,
      },
    });
    this.logger.log(
      `Purchase completed +${(data.totalAmount / 100).toFixed(2)} ${data.currency.toUpperCase()} `,
      data,
    );
  }

  private handlers: Record<string, PaymentHandler> = {
    [PRODUCTS.PLUS.id]: async ({ userId }) => {
      await this.prisma.user.update({
        where: { id: userId },
        data: { plan: UserPlan.PLUS },
      });
    },
    [PRODUCTS.PRO.id]: async ({ userId }) => {
      await this.prisma.user.update({
        where: { id: userId },
        data: { plan: UserPlan.PRO },
      });
    },
    [PRODUCTS.CREDIT.id]: async ({ userId, amount }) => {
      const user: { credits: number } = (await this.prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })) || { credits: 0 };
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          credits: +user.credits + amount,
        },
      });
    },
  };
}
