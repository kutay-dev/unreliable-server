import { getQueueToken } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Job, JobsOptions, Queue } from 'bullmq';

@Injectable()
export class BullmqService {
  constructor(private readonly moduleRef: ModuleRef) {}

  private getQueue(name: string): Queue {
    return this.moduleRef.get<Queue>(getQueueToken(name), { strict: false });
  }

  add<T>(
    queue: string,
    job: string,
    data: T,
    opts?: JobsOptions,
  ): Promise<Job<any, any, string>> {
    return this.getQueue(queue).add(job, data, opts);
  }

  schedule<T>(
    queue: string,
    job: string,
    data: T,
    when: Date,
    opts?: Omit<JobsOptions, 'delay'>,
  ): Promise<Job<any, any, string>> {
    const delay = Math.max(0, when.getTime() - Date.now());
    return this.getQueue(queue).add(job, data, {
      delay,
      removeOnComplete: true,
      ...(opts ?? {}),
    });
  }
}
