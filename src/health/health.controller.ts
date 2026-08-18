import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/presentation/decorators/public.decorator';
import { HealthService } from './health.service';
import type { HealthResponse } from './health.types';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
