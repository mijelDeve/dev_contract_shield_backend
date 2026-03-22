/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponse,
  UserResponse,
  JwtPayload,
} from './interfaces/auth-response.interface';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private jwtSecret: string;
  private jwtExpiresIn: number;

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url')!;
    const supabaseKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    )!;
    this.supabase = createClient(supabaseUrl, supabaseKey) as SupabaseClient;
    this.jwtSecret =
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN || '86400', 10);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const { error: supabaseError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      user_metadata: {
        username: dto.username,
        full_name: dto.fullName,
        wallet_address: dto.walletAddress,
        is_developer: dto.isDeveloper ?? false,
      },
    });

    if (supabaseError) {
      throw new ConflictException(
        `Supabase Auth error: ${supabaseError.message}`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.fullName,
      wallet_address: dto.walletAddress,
      is_client: true,
      is_developer: dto.isDeveloper ?? false,
    });

    const token = this.generateJwt(
      user.id,
      user.username,
      user.email,
      user.is_developer,
    );

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: this.mapToUserResponse(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    console.log('Login attempt for:', dto.email);

    const user = await this.usersService.findByEmail(dto.email);
    console.log('User found:', user);

    if (!user) {
      console.log('User not found in database');
      throw new UnauthorizedException('User not found. Please register first.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.generateJwt(
      user.id,
      user.username,
      user.email,
      user.is_developer,
    );

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: this.mapToUserResponse(user),
    };
  }

  validateJwt(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateJwt(
    userId: string,
    username: string,
    email: string,
    isDeveloper: boolean,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      username,
      email,
      isDeveloper,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  private mapToUserResponse(user: {
    id: string;
    username: string;
    email: string;
    full_name?: string;
    wallet_address?: string;
    is_client: boolean;
    is_developer: boolean;
    profile_picture_url?: string;
    bio?: string;
    is_verified: boolean;
    token_balance: number;
    created_at: string;
  }): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      walletAddress: user.wallet_address,
      isClient: user.is_client,
      isDeveloper: user.is_developer,
      profilePictureUrl: user.profile_picture_url,
      bio: user.bio,
      isVerified: user.is_verified,
      tokenBalance: user.token_balance,
      createdAt: user.created_at,
    };
  }
}
