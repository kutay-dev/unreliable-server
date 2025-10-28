import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import type { Queue, JobsOptions } from 'bullmq';

@Injectable()
export class BullmqService {
  constructor(private readonly moduleRef: ModuleRef) {}

  private getQueue(name: string): Queue {
    return this.moduleRef.get<Queue>(getQueueToken(name), { strict: false });
  }

  add<T>(queue: string, job: string, data: T, opts?: JobsOptions) {
    return this.getQueue(queue).add(job, data, opts);
  }

  schedule<T>(
    queue: string,
    job: string,
    data: T,
    when: Date,
    opts?: Omit<JobsOptions, 'delay'>,
  ) {
    const delay = Math.max(0, when.getTime() - Date.now());
    return this.getQueue(queue).add(job, data, {
      delay,
      removeOnComplete: true,
      ...(opts ?? {}),
    });
  }
}
