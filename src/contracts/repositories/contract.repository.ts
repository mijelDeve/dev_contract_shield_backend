import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { ContractWithRelations } from '../../entities/contract.entity';

interface ContractFilters {
  userId: number;
  systemStatusCode?: string;
  genlayerStatusCode?: string;
}

@Injectable()
export class ContractRepository {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(
    filters: ContractFilters,
    page: number,
    limit: number,
  ): Promise<{ data: ContractWithRelations[]; total: number }> {
    const offset = (page - 1) * limit;
    const client = this.supabaseService.admin;

    let query = client
      .from('contracts')
      .select(
        `
        *,
        contract_system_statuses(id, code, name_es, name_en),
        genlayer_transaction_statuses(id, code, name, phase),
        creator:users!creator_id(id, username),
        developer:users!developer_id(id, username)
      `,
        { count: 'exact' },
      )
      .or(`creator_id.eq.${filters.userId},developer_id.eq.${filters.userId}`);

    if (filters.systemStatusCode) {
      query = query.eq(
        'contract_system_statuses.code',
        filters.systemStatusCode,
      );
    }

    if (filters.genlayerStatusCode) {
      query = query.eq(
        'genlayer_transaction_statuses.code',
        filters.genlayerStatusCode,
      );
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const response = await query;
    const { data, error, count } = response as {
      data: ContractWithRelations[];
      error: Error | null;
      count: number;
    };

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
    };
  }

  async findById(id: number): Promise<ContractWithRelations | null> {
    const client = this.supabaseService.admin;

    const response = await client
      .from('contracts')
      .select(
        `
        *,
        contract_system_statuses(id, code, name_es, name_en),
        genlayer_transaction_statuses(id, code, name, phase),
        creator:users!creator_id(id, username),
        developer:users!developer_id(id, username)
      `,
      )
      .eq('id', id)
      .single();

    const { data, error } = response as {
      data: ContractWithRelations;
      error: Error | null;
    };

    if (error) return null;
    return data;
  }

  async updateCoverage(id: number, coverage: number): Promise<number> {
    const client = this.supabaseService.admin;

    const { data, error } = await client
      .from('contracts')
      .update({ coverage: Number(coverage) })
      .eq('id', id)
      .select('id, coverage')
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(`No se pudo actualizar coverage para contrato ${id}`);
    }

    return Number((data as { coverage: number | null }).coverage ?? 0);
  }

  async updateGithubRepoAndStatus(
    id: number,
    githubRepoUrl: string,
    systemStatusId: number,
  ): Promise<{ id: number; description?: string | null }> {
    const client = this.supabaseService.admin;

    const { data, error } = await client
      .from('contracts')
      .update({
        github_repo_url: githubRepoUrl,
        is_github_project: true,
        system_status_id: systemStatusId,
      })
      .eq('id', id)
      .select('id, description')
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(
        `No se pudo actualizar github_repo_url para contrato ${id}`,
      );
    }

    return data as { id: number; description?: string | null };
  }

  async updateSystemStatus(
    id: number,
    systemStatusId: number,
  ): Promise<number> {
    const client = this.supabaseService.admin;

    const { data, error } = await client
      .from('contracts')
      .update({ system_status_id: systemStatusId })
      .eq('id', id)
      .select('id, system_status_id')
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(
        `No se pudo actualizar system_status_id para contrato ${id}`,
      );
    }

    return Number(
      (data as { system_status_id: number | null }).system_status_id ?? 0,
    );
  }
}
