/* all-exception.filter.ts */

// 引入所需内置对象
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

// 们需要访问底层平台 `Request`和 `Response`
import { Response } from 'express';

// 它负责捕获作为`HttpException`类实例
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    // 用于接收主动发错的错误信息
    const { message, code } = exception.getResponse() as any;
    response.status(200).json({
      code: code || status,
      //   path: request.url,
      error: message,
      message: exception.message,
    });
  }
}
