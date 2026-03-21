import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';
import supabaseConfig from '../config/configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [supabaseConfig],
      isGlobal: true,
    }),
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
