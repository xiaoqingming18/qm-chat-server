import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatHistoryService } from 'src/chat-history/chat-history.service';

@Module({
  providers: [ChatGateway, ChatService, ChatHistoryService],
})
export class ChatModule {}
