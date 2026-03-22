import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Request() req: Request & { user?: { sub: string } }) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.usersService.findById(userId);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async findAll(@Query('isDeveloper') isDeveloper?: string) {
    const options =
      isDeveloper !== undefined ? { isDeveloper: isDeveloper === 'true' } : {};
    return this.usersService.findAllForContractSelect(options);
  }
}
