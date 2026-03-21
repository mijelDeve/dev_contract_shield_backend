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

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      (request as Request & { user: JwtPayload }).user = payload;
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Invalid token';
      throw new UnauthorizedException(
        `Invalid or expired token: ${errorMessage}`,
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) return undefined;

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return undefined;
    }

    return parts[1];
  }
}
