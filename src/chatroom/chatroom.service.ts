import { BadRequestException, Injectable } from '@nestjs/common';

// Services
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {
  constructor(private prismaService: PrismaService) {}

  async createOneToOneChatroom(friendId: number, userId: number) {
    const { id } = await this.prismaService.chatroom.create({
      data: {
        name: `聊天室${Math.random().toString().slice(2, 8)}`,
        type: false,
      },
      select: {
        id: true,
      },
    });

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });
    await this.prismaService.userChatroom.create({
      data: {
        userId: friendId,
        chatroomId: id,
      },
    });

    return '创建成功';
  }

  /**
   * 创建群聊
   * @param name // 群聊名称
   * @param userId // 用户 id（群主）
   * @returns
   */
  async createGroupChatroom(name: string, userId: number) {
    const { id } = await this.prismaService.chatroom.create({
      data: {
        name,
        type: true,
      },
    });

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });

    return '创建成功';
  }

  /**
   * 获取聊天室成员
   * @param chatroomId // 聊天室 id
   * @returns
   */
  async members(chatroomId: number) {
    const userIds = await this.prismaService.userChatroom.findMany({
      where: {
        chatroomId,
      },
      select: {
        userId: true,
      },
    });
    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          in: userIds.map((item) => item.userId),
        },
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        headPic: true,
        createTime: true,
        email: true,
      },
    });
    return users;
  }

  /**
   * 获取用户的聊天室列表
   * @param userId // 用户 id
   * @returns
   */
  async list(userId: number) {
    const chatroomIds = await this.prismaService.userChatroom.findMany({
      where: {
        userId,
      },
      select: {
        chatroomId: true,
      },
    });

    const chatrooms = await this.prismaService.chatroom.findMany({
      where: {
        id: {
          in: chatroomIds.map((item) => item.chatroomId),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        createTime: true,
      },
    });

    const res = [];
    for (let i = 0; i < chatrooms.length; i++) {
      const userIds = await this.prismaService.userChatroom.findMany({
        where: {
          chatroomId: chatrooms[i].id,
        },
        select: {
          userId: true,
        },
      });
      res.push({
        ...chatrooms[i],
        userCount: userIds.length,
        userIds: userIds.map((item) => item.userId),
      });
    }

    return res;
  }

  /**
   * 获取聊天室信息
   * @param id // 聊天室 id
   * @returns
   */
  async info(id: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });
    return { ...chatroom, users: await this.members(id) };
  }

  /**
   * 加入群聊
   * @param id // 聊天室 id
   * @param userId // 用户 id
   * @returns
   */
  async join(id: number, userId: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });
    if (chatroom.type === false) {
      throw new BadRequestException('一对一聊天室不能加入成员');
    }

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });

    return '加入成功';
  }

  /**
   * 退出聊天室
   * @param id // 聊天室 id
   * @param userId // 用户 id
   * @returns
   */
  async quit(id: number, userId: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });
    if (chatroom.type === false) {
      throw new BadRequestException('一对一聊天室不能退出');
    }

    await this.prismaService.userChatroom.deleteMany({
      where: {
        userId,
        chatroomId: id,
      },
    });

    return '退出成功';
  }
}
