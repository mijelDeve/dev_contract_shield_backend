import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private supabaseService: SupabaseService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => {
        const { error } = await this.supabaseService.client
          .from('users')
          .select('id')
          .limit(1);
        return {
          supabase: {
            status: error ? 'down' : 'up',
            message: error?.message,
          },
        };
      },
    ]);
  }

  @Get('live')
  @HealthCheck()
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
