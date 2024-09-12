import { Injectable, Inject } from '@nestjs/common';
import { ChatHistory } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type ChatHistoryDto = Pick<
  ChatHistory,
  'chatroomId' | 'senderId' | 'type' | 'content'
>;

@Injectable()
export class ChatHistoryService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 获取聊天记录
  async list(chatroomId: number) {
    const history = await this.prismaService.chatHistory.findMany({
      where: {
        chatroomId,
      },
    });

    const res = [];
    for (let i = 0; i < history.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: history[i].senderId,
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          headPic: true,
          createTime: true,
        },
      });
      res.push({
        ...history[i],
        sender: user,
      });
    }

    return res;
  }

  // 保存消息到聊天记录
  async add(chatroomId: number, chatHistory: ChatHistoryDto) {
    return this.prismaService.chatHistory.create({
      data: chatHistory,
    });
  }
}
