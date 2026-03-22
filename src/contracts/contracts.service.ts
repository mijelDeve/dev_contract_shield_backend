import { Injectable } from '@nestjs/common';
import { ContractRepository } from './repositories/contract.repository';
import {
  ContractResponse,
  PaginatedContractsResponse,
  ContractWithRelations,
} from '../entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private contractRepository: ContractRepository) {}

  async findAllByUser(
    userId: string,
    page: number,
    limit: number,
    statusCode?: string,
    genlayerStatusCode?: string,
  ): Promise<PaginatedContractsResponse> {
    const userIdNum = parseInt(userId, 10);

    const { data, total } = await this.contractRepository.findAll(
      {
        userId: userIdNum,
        systemStatusCode: statusCode,
        genlayerStatusCode: genlayerStatusCode,
      },
      page,
      limit,
    );

    return {
      data: data.map((contract) => this.mapToResponse(contract)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateContractDto): Promise<ContractResponse> {
    const contract = await this.contractRepository.create({
      title: dto.title,
      amount: dto.amount,
      description: dto.description ?? '',
      start_date: dto.startDate,
      due_date: dto.dueDate,
      is_github_project: dto.isGithubProject,
      system_status_id: 1,
      creator_id: 10,
      developer_id: 9,
      coverage: 0,
    });

    return this.mapToResponse(contract);
  }

  private mapToResponse(contract: ContractWithRelations): ContractResponse {
    return {
      id: contract.id,
      title: contract.title,
      description: contract.description,
      coverage: contract.coverage ?? null,
      amount: parseFloat(String(contract.amount)),
      startDate: contract.start_date,
      dueDate: contract.due_date,
      zipFilePath: contract.zip_file_path,
      githubRepoUrl: contract.github_repo_url,
      isGithubProject: contract.is_github_project,
      systemStatus: contract.contract_system_statuses
        ? {
            id: contract.contract_system_statuses.id,
            code: contract.contract_system_statuses.code,
            nameEs: contract.contract_system_statuses.name_es,
            nameEn: contract.contract_system_statuses.name_en,
          }
        : { id: 0, code: 'unknown', nameEs: 'Desconocido' },
      genlayerStatus: contract.genlayer_transaction_statuses
        ? {
            id: contract.genlayer_transaction_statuses.id,
            code: contract.genlayer_transaction_statuses.code,
            name: contract.genlayer_transaction_statuses.name,
            phase: contract.genlayer_transaction_statuses.phase,
          }
        : null,
      creator: contract.creator
        ? {
            id: contract.creator.id,
            username: contract.creator.username,
          }
        : { id: 0, username: 'unknown' },
      developer: contract.developer
        ? {
            id: contract.developer.id,
            username: contract.developer.username,
          }
        : null,
      createdAt: contract.created_at,
    };
  }
}
