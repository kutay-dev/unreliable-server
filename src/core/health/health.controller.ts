import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HttpHealthIndicator,
  HealthIndicatorFunction,
  HealthCheckResult,
} from '@nestjs/terminus';
import * as os from 'os';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private httpIndicator: HttpHealthIndicator,
  ) {}

  private internalChecks(cpuStatus: 'up' | 'down'): HealthIndicatorFunction[] {
    return [
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: '/' }),
      () => ({ cpu: { status: cpuStatus } }),
    ];
  }

  private computeCpuStatus(): 'up' | 'down' {
    const cpuLoad = os.loadavg()[0];
    const cpuCores = os.cpus().length;
    return cpuLoad < cpuCores * 2 ? 'up' : 'down';
  }

  @Get('liveness')
  @HealthCheck()
  async liveness(): Promise<HealthCheckResult> {
    const cpuStatus = this.computeCpuStatus();
    return this.health.check(this.internalChecks(cpuStatus));
  }

  @Get('readiness')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    const cpuStatus = this.computeCpuStatus();
    return this.health.check([
      ...this.internalChecks(cpuStatus),
      () =>
        this.httpIndicator.pingCheck(
          'network',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ),
    ]);
  }
}
