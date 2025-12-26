import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register = new promClient.Registry();

  httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  constructor() {
    promClient.collectDefaultMetrics({ register: this.register });
    this.register.registerMetric(this.httpRequestsTotal);
  }

  getMetrics() {
    return this.register.metrics();
  }
}
