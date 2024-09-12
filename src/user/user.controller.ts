import { Body, Controller, Post, Get, Inject, Query } from '@nestjs/common';

// Services
import { UserService } from './user.service';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

// Utils
import { getCaptchaMailContent } from 'src/utils/mail';
import { RequireLogin, UserInfo } from 'src/custom-decorator';

// DTO
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/udpate-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  // 用户注册
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    // delete registerUser.captcha;
    return await this.userService.create(registerUser);
  }

  // 发送注册验证码
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    if (!address) {
      return {
        code: 10001,
        message: '邮箱不能为空',
      };
    }

    const code = Math.random().toString().slice(2, 8);

    // 防止重复发送
    // if (await this.redisService.get(`captcha_${address}`)) {
    //   return {
    //     code: 10002,
    //     message: '验证码已发送，请查看邮箱',
    //   };
    // }

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: getCaptchaMailContent(code),
    });
    return {
      code: 0,
      message: '发送成功',
    };
  }

  // 用户登录
  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const user = await this.userService.login(loginUser);
    return user;
  }

  // 用户信息
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    return this.userService.findUserDetailById(userId);
  }

  // 修改密码
  @Post('update_password')
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(passwordDto);
  }

  // 修改密码邮箱验证码
  @Get('update_captcha')
  @RequireLogin()
  async updateCaptcha(@UserInfo('userId') userId: number) {
    const { email: address } =
      await this.userService.findUserDetailById(userId);

    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_user_captcha_${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  // 修改用户信息
  @Post('update')
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateUserDto);
  }

  // 好友列表
  @Get('friendship')
  @RequireLogin()
  async friendship(@UserInfo('userId') userId: number) {
    return this.userService.getFriendShip(userId);
  }
}
