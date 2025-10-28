// src/core/bullmq/bullmq.module.ts
import { Global, Module } from '@nestjs/common';
import { BullmqService } from './bullmq.service';

@Global()
@Module({
  providers: [BullmqService],
  exports: [BullmqService],
})
export class BullmqModule {}
