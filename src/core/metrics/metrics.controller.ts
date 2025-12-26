import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async metricsEndpoint(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.metricsService.getMetrics());
  }
}
