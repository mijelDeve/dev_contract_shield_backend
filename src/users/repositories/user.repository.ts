import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { BaseRepository, BaseEntity } from '../../repositories/base.repository';
import { CreateUserDto, UpdateUserDto } from '../../entities/user.entity';

interface UserEntity extends BaseEntity {
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  wallet_address?: string;
  is_client: boolean;
  is_developer: boolean;
  profile_picture_url?: string;
  bio?: string;
  is_verified: boolean;
  token_balance: number;
}

interface FindAllUsersOptions {
  limit?: number;
  offset?: number;
  isDeveloper?: boolean;
}

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  protected readonly tableName = 'users';
  protected readonly supabase: SupabaseService;

  constructor(supabase: SupabaseService) {
    super();
    this.supabase = supabase;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    console.log(email);
    return this.findOne({ email });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.findOne({ username });
  }

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const client = this.adminClient;
    const data = {
      ...dto,
      is_client: dto.is_client ?? true,
      is_developer: dto.is_developer ?? false,
      is_verified: false,
      token_balance: 0,
    };

    const response = await client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    const { data: result, error } = response as {
      data: UserEntity;
      error: Error | null;
    };

    if (error) throw error;
    return result;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    return this.update(id, dto as Partial<UserEntity>);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(id);
  }

  async findAllUsers(options?: FindAllUsersOptions): Promise<UserEntity[]> {
    let query = this.client.from(this.tableName).select('*');

    if (options?.isDeveloper !== undefined) {
      query = query.eq('is_developer', options.isDeveloper);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1,
      );
    }

    const response = await query;
    const { data, error } = response as {
      data: UserEntity[];
      error: Error | null;
    };

    if (error) throw error;
    return data || [];
  }
}
