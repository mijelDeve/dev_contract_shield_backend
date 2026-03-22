import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ListContractsDto } from './dto/list-contracts.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import {
  ContractResponse,
  PaginatedContractsResponse,
} from '../entities/contract.entity';

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

  @Post()
  async create(
    @Body() createContractDto: CreateContractDto,
  ): Promise<ContractResponse> {
    return this.contractsService.create(createContractDto);
  }

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
