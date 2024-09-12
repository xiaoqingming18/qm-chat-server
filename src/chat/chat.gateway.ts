import {
  WebSocketGateway,
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { ChatHistoryService } from 'src/chat-history/chat-history.service';
import { Inject } from '@nestjs/common';

interface JoinRoomPayload {
  chatroomId: number;
  userId: number;
}

interface SendMessagePayload {
  sendUserId: number;
  chatroomId: number;
  message: {
    type: 'text' | 'image';
    content: string;
  };
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @Inject(ChatHistoryService)
  private chatHistoryService: ChatHistoryService;

  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer() server: Server;

  // 加入房间
  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, payload: JoinRoomPayload): void {
    const roomName = payload.chatroomId.toString();

    client.join(roomName);

    this.server.to(roomName).emit('message', {
      type: 'joinRoom',
      userId: payload.userId,
    });
  }

  // 发送消息
  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() payload: SendMessagePayload) {
    const roomName = payload.chatroomId.toString();

    // 保存消息到聊天记录
    await this.chatHistoryService.add(payload.chatroomId, {
      content: payload.message.content,
      type: payload.message.type === 'image' ? 1 : 0,
      chatroomId: payload.chatroomId,
      senderId: payload.sendUserId,
    });

    this.server.to(roomName).emit('message', {
      type: 'sendMessage',
      userId: payload.sendUserId,
      message: payload.message,
    });
  }
}
