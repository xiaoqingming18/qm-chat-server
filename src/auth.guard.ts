import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

interface JwtUserData {
  userId: number;
  username: string;
}

declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest(); // 获取请求对象

    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      // 获取装饰器的元数据
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireLogin) {
      // 如果没有登录装饰器，直接返回 true，放行
      return true;
    }

    const authorization = request.headers.authorization; // 获取请求头中的 authorization 字段

    if (!authorization) {
      throw new UnauthorizedException('用户未登录'); // 如果没有 authorization 字段，抛出未登录异常
    }

    try {
      // 解析 token
      const token = authorization.split(' ')[1];
      const data = this.jwtService.verify<JwtUserData>(token);

      // 将用户信息挂载到 request 对象上
      request.user = {
        userId: data.userId,
        username: data.username,
      };
      return true;
    } catch (e) {
      // token 失效，抛出未授权异常
      throw new UnauthorizedException('token 失效，请重新登录');
    }
  }
}
