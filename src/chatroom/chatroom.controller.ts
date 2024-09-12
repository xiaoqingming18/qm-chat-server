import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { RequireLogin, UserInfo } from 'src/custom-decorator';

@Controller('chatroom')
@RequireLogin()
export class ChatroomController {
  constructor(private readonly chatroomService: ChatroomService) {}

  /**
   * 创建一对一聊天
   * @param {Number} friendId // 聊天好友的 id
   * @param {Number} userId  // 用户 id
   * @returns
   */
  @Get('create-one-to-one')
  async oneToOne(
    @Query('friendId') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('聊天好友的 id 不能为空');
    }
    return this.chatroomService.createOneToOneChatroom(friendId, userId);
  }

  /**
   * 创建群聊
   * @param {String} name // 群聊名称
   * @param {Number} userId // 用户 id（群主）
   * @returns
   */
  @Get('create-group')
  async group(@Query('name') name: string, @UserInfo('userId') userId: number) {
    return this.chatroomService.createGroupChatroom(name, userId);
  }

  /**
   * 获取聊天室成员
   * @param chatroomId // 聊天室 id
   * @returns
   */
  @Get('members')
  async members(@Query('chatroomId') chatroomId: number) {
    if (!chatroomId) {
      throw new BadRequestException('chatroomId 不能为空');
    }
    return this.chatroomService.members(chatroomId);
  }

  /**
   * 获取用户的聊天室列表
   * @param {Number} userId // 用户 id
   * @returns
   */
  @Get('list')
  async list(@UserInfo('userId') userId: number) {
    if (!userId) {
      throw new BadRequestException('用户 id 不能为空');
    }

    return this.chatroomService.list(userId);
  }

  /**
   * 获取聊天室信息
   * @param id // 聊天室 id
   * @returns
   */
  @Get('info/:id')
  async info(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    return this.chatroomService.info(id);
  }

  /**
   * 加入群聊
   * @param id // 聊天室 id
   * @param joinUserId // 加入群聊的用户 id
   * @returns
   */
  @Get('join/:id')
  async join(@Param('id') id: number, @Query('joinUserId') joinUserId: number) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (!joinUserId) {
      throw new BadRequestException('joinUserId 不能为空');
    }
    return this.chatroomService.join(id, joinUserId);
  }

  /**
   * 退出群聊
   * @param id // 聊天室 id
   * @param quitUserId // 退出群聊的用户 id
   * @returns
   */
  @Get('quit/:id')
  async quit(@Param('id') id: number, @Query('quitUserId') quitUserId: number) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (!quitUserId) {
      throw new BadRequestException('quitUserId 不能为空');
    }
    return this.chatroomService.quit(id, quitUserId);
  }
}
