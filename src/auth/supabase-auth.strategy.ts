import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email?: string;
  aud: string;
  role?: string;
  iss: string;
  exp: number;
  iat: number;
}

@Injectable()
export class SupabaseAuthStrategy extends PassportStrategy(
  Strategy,
  'supabase',
) {
  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>('supabase.url')!;
    const supabaseAnonKey = configService.get<string>('supabase.anonKey')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: supabaseUrl,
      issuer: `${supabaseUrl}`,
      algorithms: ['HS256'],
      secretOrKey: supabaseAnonKey,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
