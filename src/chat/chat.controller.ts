import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('chat')
@UseGuards(SupabaseAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() chatMessageDto: ChatMessageDto) {
    return this.chatService.chat(
      chatMessageDto.message,
      chatMessageDto.history ?? [],
      chatMessageDto.contractDescription,
    );
  }
}
