import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

@Injectable()
export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract readonly tableName: string;
  protected abstract readonly supabase: SupabaseService;

  protected get client(): SupabaseClient {
    return this.supabase.client;
  }

  protected get adminClient(): SupabaseClient {
    return this.supabase.admin;
  }

  async findAll(
    filters?: Record<string, unknown>,
    options?: { limit?: number; orderBy?: string; ascending?: boolean },
  ): Promise<T[]> {
    let query = this.adminClient.from(this.tableName).select('*');

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const response = await query;
    const { data, error } = response as { data: T[]; error: Error | null };

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<T | null> {
    const response = await this.adminClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    const { data, error } = response as { data: T; error: Error | null };

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async findOne(filters: Record<string, unknown>): Promise<T | null> {
    let query = this.adminClient.from(this.tableName).select('*');
    query = this.applyFilters(query, filters);

    const response = await query.single();
    const { data, error } = response as { data: T; error: Error | null };

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async create(
    data: Omit<T, 'id' | 'created_at'>,
    useAdmin = false,
  ): Promise<T> {
    const client = useAdmin ? this.adminClient : this.client;
    const response = await client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    const { data: result, error } = response as {
      data: T;
      error: Error | null;
    };

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Partial<T>, useAdmin = false): Promise<T> {
    const client = useAdmin ? this.adminClient : this.client;
    const response = await client
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    const { data: result, error } = response as {
      data: T;
      error: Error | null;
    };

    if (error) throw error;
    return result;
  }

  async delete(id: string, useAdmin = false): Promise<void> {
    const client = useAdmin ? this.adminClient : this.client;
    const { error } = await client.from(this.tableName).delete().eq('id', id);

    if (error) throw error;
  }

  async count(filters?: Record<string, unknown>): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    const response = await query;
    const { count, error } = response as { count: number; error: Error | null };

    if (error) throw error;
    return count || 0;
  }

  private applyFilters(
    query: ReturnType<ReturnType<SupabaseClient['from']>['select']>,
    filters: Record<string, unknown>,
  ): ReturnType<ReturnType<SupabaseClient['from']>['select']> {
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        query = query.in(key, value as string[]);
      } else if (typeof value === 'object' && value !== null) {
        const filter = value as { op: string; value: unknown };
        switch (filter.op) {
          case 'eq':
            query = query.eq(key, filter.value);
            break;
          case 'ne':
            query = query.neq(key, filter.value);
            break;
          case 'gt':
            query = query.gt(key, filter.value as number);
            break;
          case 'gte':
            query = query.gte(key, filter.value as number);
            break;
          case 'lt':
            query = query.lt(key, filter.value as number);
            break;
          case 'lte':
            query = query.lte(key, filter.value as number);
            break;
          case 'like':
            query = query.like(key, `%${String(filter.value)}%`);
            break;
          case 'ilike':
            query = query.ilike(key, `%${String(filter.value)}%`);
            break;
          case 'is':
            query = query.is(key, filter.value);
            break;
        }
      } else {
        query = query.eq(key, value);
      }
    }
    return query;
  }
}
