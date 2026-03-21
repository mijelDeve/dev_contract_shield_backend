/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  isDeveloper: boolean;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret =
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    console.log('Auth Guard - Headers:', request.headers);
    console.log('Auth Guard - Authorization:', request.headers.authorization);

    const token = this.extractTokenFromHeader(request);
    console.log(
      'Auth Guard - Token extracted:',
      token ? `${token.substring(0, 50)}...` : 'null',
    );

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      console.log('Auth Guard - Payload verified:', payload);
      (request as Request & { user: JwtPayload }).user = payload;
      return true;
    } catch (error) {
      console.log('Auth Guard - Token verification error:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    console.log('Auth Guard - Auth header value:', authHeader);

    if (!authHeader) return undefined;

    const parts = authHeader.split(' ');
    console.log('Auth Guard - Parts:', parts);

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Auth Guard - Invalid format');
      return undefined;
    }

    return parts[1];
  }
}
