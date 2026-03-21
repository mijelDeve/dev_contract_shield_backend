import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url')!;
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey')!;
    const supabaseServiceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    )!;

    this.supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
    ) as SupabaseClient;
    this.supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    ) as SupabaseClient;
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get admin(): SupabaseClient {
    return this.supabaseAdmin;
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }
}
