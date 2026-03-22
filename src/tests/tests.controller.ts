import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Res,
  Request,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { TestsService } from './tests.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SaveGithubRepoDto } from './dto/save-github-repo.dto';

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

  @Patch('contracts/:id/github-repo')
  @UseGuards(SupabaseAuthGuard)
  async saveGithubRepoAndStartFlow(
    @Param('id') id: string,
    @Body() body: SaveGithubRepoDto,
    @Request() req: Request & { user: JwtPayload },
  ): Promise<{
    message: string;
    streamUrl: string;
    coverageUrl: string;
    features: string;
    systemStatusId: number;
  }> {
    const contractId = parseInt(id, 10);

    if (isNaN(contractId)) {
      throw new NotFoundException('ID de contrato inválido');
    }

    return this.testsService.saveGithubRepoAndStartFlow(
      contractId,
      req.user.sub,
      body.githubRepoUrl,
    );
  }

  @Post('contracts/:id/genlayer/approve')
  @UseGuards(SupabaseAuthGuard)
  async approveContractWithGenlayer(
    @Param('id') id: string,
    @Request() req: Request & { user: JwtPayload },
  ): Promise<{
    message: string;
    contractId: number;
    systemStatusId: number;
    approved: boolean;
    sentToGenlayer: boolean;
    coverage: number;
    requirementsComparison: string;
  }> {
    const contractId = parseInt(id, 10);

    if (isNaN(contractId)) {
      throw new NotFoundException('ID de contrato inválido');
    }

    return this.testsService.submitGenlayerApproval(contractId, req.user.sub);
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

  @Get('contracts/:id/tests/coverage')
  @UseGuards(SupabaseAuthGuard)
  async getCoverage(@Param('id') id: string): Promise<{
    status: string;
    message: string;
    coverage: number | null;
  }> {
    const contractId = parseInt(id, 10);

    if (isNaN(contractId)) {
      throw new NotFoundException('ID de contrato inválido');
    }

    const result = await this.testsService.getCoverageStatus(contractId);

    if (result.status === 'not_found') {
      throw new NotFoundException('Contrato no encontrado');
    }

    return result;
  }
}
