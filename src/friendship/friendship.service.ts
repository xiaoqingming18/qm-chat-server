import { FriendAddDto } from './dto/friend-add.dto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendshipService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 申请添加好友
  async add(friendAddDto: FriendAddDto, userId: number) {
    // TODO: 检查是否已经是好友
    // TODO: 检查是否已经发送过好友申请
    // TODO: 检查要添加的用户是否存在
    const existUser = await this.prismaService.user.findUnique({
      where: {
        id: friendAddDto.friendId,
      },
    });
    if (!existUser) {
      return '用户不存在';
    }

    return await this.prismaService.friendRequest.create({
      data: {
        fromUserId: userId,
        toUserId: friendAddDto.friendId,
        reason: friendAddDto.reason,
        status: 0,
      },
    });
  }

  // 好友申请列表
  async list(userId: number) {
    console.log('userId', userId);
    return this.prismaService.friendRequest.findMany({
      where: {
        toUserId: userId,
      },
    });
  }

  // 同意好友申请
  async agree(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        fromUserId: friendId,
        toUserId: userId,
        status: 0,
      },
      data: {
        status: 1,
      },
    });

    const res = await this.prismaService.friendship.findMany({
      where: {
        userId,
        friendId,
      },
    });

    if (!res.length) {
      await this.prismaService.friendship.create({
        data: {
          userId,
          friendId,
        },
      });
    }
    return '添加成功';
  }

  // 拒绝好友申请
  async reject(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        fromUserId: friendId,
        toUserId: userId,
        status: 0,
      },
      data: {
        status: 2,
      },
    });
    return '已拒绝';
  }

  // 删除好友
  async remove(friendId: number, userId: number) {
    await this.prismaService.friendship.deleteMany({
      where: {
        userId,
        friendId,
      },
    });
    return '删除成功';
  }
}
