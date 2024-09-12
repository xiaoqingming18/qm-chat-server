import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { RequireLogin, UserInfo } from 'src/custom-decorator';
import { FriendAddDto } from './dto/friend-add.dto';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  // 发送好友申请
  @Post('add')
  @RequireLogin()
  async add(
    @Body() friendAddDto: FriendAddDto,
    @UserInfo('userId') userId: number,
  ) {
    return this.friendshipService.add(friendAddDto, userId);
  }

  // 好友申请列表
  @Get('request_list')
  @RequireLogin()
  async list(@UserInfo('userId') userId: number) {
    return this.friendshipService.list(userId);
  }

  // 同意好友申请
  @Get('agree/:id')
  @RequireLogin()
  async agree(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('添加的好友 id 不能为空');
    }
    return this.friendshipService.agree(friendId, userId);
  }

  // 拒绝好友申请
  @Get('reject/:id')
  @RequireLogin()
  async reject(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('添加的好友 id 不能为空');
    }
    return this.friendshipService.reject(friendId, userId);
  }

  // 删除好友
  @Get('remove/:id')
  @RequireLogin()
  async remove(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    return this.friendshipService.remove(friendId, userId);
  }
}
