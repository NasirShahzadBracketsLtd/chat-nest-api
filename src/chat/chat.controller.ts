import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history/:roomId')
  async getChatHistory(@Param('roomId') roomId: string) {}

  @Get('rooms/:userId')
  async getUserRooms(@Param('userId') userId: string) {}
}
