import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async getUsersForContractSelect(
    @Query('isDeveloper') isDeveloper?: string,
  ): Promise<
    Array<{
      id: string;
      username: string;
      email: string;
      fullName?: string;
      isDeveloper: boolean;
      profilePictureUrl?: string;
    }>
  > {
    if (
      isDeveloper !== undefined &&
      isDeveloper !== 'true' &&
      isDeveloper !== 'false'
    ) {
      throw new BadRequestException(
        'isDeveloper debe ser true o false cuando se envía',
      );
    }

    return this.usersService.findAllForContractSelect({
      isDeveloper:
        isDeveloper !== undefined ? isDeveloper === 'true' : undefined,
    });
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Request() req: Request & { user?: { sub: string } }) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.usersService.findById(userId);
  }
}
