import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

// Services
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';

// Utils
import { md5 } from 'src/utils';

// DTO
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/udpate-user.dto';

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prismaService: PrismaService;
  @Inject(RedisService)
  private redisService: RedisService;
  @Inject(JwtService)
  private jwtService: JwtService;

  // 用户注册
  async create(userData: RegisterUserDto) {
    // 邮箱验证码校验
    const captcha = await this.redisService.get(`captcha_${userData.email}`);
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (userData.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    // 判断用户名是否存在
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: userData.username,
      },
    });
    if (foundUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    // 创建用户
    try {
      return await this.prismaService.user.create({
        data: {
          username: userData.username,
          password: md5(userData.password),
          email: userData.email,
          nickName: userData.nickName,
        },
        select: {
          id: true,
          username: true,
          email: true,
          nickName: true,
          headPic: true,
          createTime: true,
        },
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  // 用户登录
  async login(loginUser: LoginUserDto) {
    const existUser = await this.prismaService.user.findUnique({
      where: {
        username: loginUser.username,
      },
    });
    if (!existUser) {
      // 用户不存在
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (existUser.password !== md5(loginUser.password)) {
      // 密码错误
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    delete existUser.password;
    return {
      user: existUser,
      token: this.jwtService.sign(
        {
          userId: existUser.id,
          username: existUser.username,
        },
        {
          expiresIn: '7d',
        },
      ),
    };
  }

  // 根据用户 id 查找用户信息
  async findUserDetailById(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
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
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  // 修改用户密码
  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    // 邮箱验证码校验
    const captcha = await this.redisService.get(
      `update_user_captcha_${passwordDto.email}`,
    );
    // 没找到验证码，说明验证码已失效
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    // 验证码不正确
    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    // 查找用户
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: passwordDto.username,
      },
    });
    // 更新密码
    foundUser.password = md5(passwordDto.password);

    try {
      // 更新密码保存到数据库
      await this.prismaService.user.update({
        where: {
          id: foundUser.id,
        },
        data: foundUser,
      });
      return '密码修改成功';
    } catch (e) {
      return '密码修改失败';
    }
  }

  // 修改用户信息
  async update(userId: number, updateUserDto: UpdateUserDto) {
    // 邮箱验证码校验
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    // 查找用户
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    // 更新用户信息
    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }
    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic;
    }

    try {
      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: foundUser,
      });
      return '用户信息修改成功';
    } catch (e) {
      return '用户信息修改失败';
    }
  }

  // 获取好友列表
  async getFriendShip(userId: number) {
    const friends = await this.prismaService.friendship.findMany({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            friendId: userId,
          },
        ],
      },
    });

    const set = new Set<number>();
    for (let i = 0; i < friends.length; i++) {
      set.add(friends[i].userId);
      set.add(friends[i].friendId);
    }

    const friendIds = [...set].filter((item) => item !== userId);

    const res = [];

    for (let i = 0; i < friendIds.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: friendIds[i],
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
        },
      });
      res.push(user);
    }

    return res;
  }
}
