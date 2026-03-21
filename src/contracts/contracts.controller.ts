import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ListContractsDto } from './dto/list-contracts.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PaginatedContractsResponse } from '../entities/contract.entity';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  isDeveloper: boolean;
}

@Controller('contracts')
@UseGuards(SupabaseAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  async findAll(
    @Query() query: ListContractsDto,
    @Request() req: Request & { user: JwtPayload },
  ): Promise<PaginatedContractsResponse> {
    return this.contractsService.findAllByUser(
      req.user.sub,
      query.page || 1,
      query.limit || 10,
      query.status,
      query.genlayerStatus,
    );
  }
}
