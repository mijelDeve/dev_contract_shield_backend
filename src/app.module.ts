import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContractsModule } from './contracts/contracts.module';
import { TestsModule } from './tests/tests.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    SupabaseModule,
    UsersModule,
    AuthModule,
    ContractsModule,
    TestsModule,
    ChatModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
