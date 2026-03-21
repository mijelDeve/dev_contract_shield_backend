import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { TestsService } from './tests.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  isDeveloper: boolean;
}

@Controller()
export class TestsController {
  constructor(private testsService: TestsService) {}

  @Post('contracts/:id/tests/run')
  @UseGuards(SupabaseAuthGuard)
  async runTests(
    @Param('id') id: string,
    @Request() req: Request & { user: JwtPayload },
  ): Promise<{ message: string; streamUrl: string }> {
    const contractId = parseInt(id, 10);

    if (isNaN(contractId)) {
      throw new NotFoundException('ID de contrato inválido');
    }

    return this.testsService.validateAndRunTests(contractId, req.user.sub);
  }

  @Get('logs/:id/stream')
  streamLogs(@Param('id') id: string, @Res() res: Response): void {
    const contractId = parseInt(id, 10);

    if (isNaN(contractId)) {
      res.status(400).json({ error: 'ID de contrato inválido' });
      return;
    }

    const contractIdStr = String(contractId);
    const logsSubject = this.testsService.getLogsSubject(contractIdStr);

    if (!logsSubject) {
      res
        .status(404)
        .json({ error: 'No hay ejecución de tests activa para este contrato' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const subscription = logsSubject.subscribe({
      next: (data: string) => {
        res.write(`data: ${data}\n\n`);
      },
      error: (err) => {
        console.error('SSE Error:', err);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
      res.end();
    });
  }

  @Get('logs/:id/report')
  @UseGuards(SupabaseAuthGuard)
  getReport(@Param('id') id: string): { report?: object; status: string } {
    const contractIdStr = String(id);
    const execution = this.testsService.getExecution(contractIdStr);

    if (!execution) {
      return { status: 'not_found' };
    }

    return {
      status: execution.status,
      report: execution.report,
    };
  }
}
