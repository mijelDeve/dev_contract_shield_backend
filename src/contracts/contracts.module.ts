import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractRepository } from './repositories/contract.repository';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractRepository],
  exports: [ContractsService],
})
export class ContractsModule {}
