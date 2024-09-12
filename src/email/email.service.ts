import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '2016316854@qq.com',
        pass: 'mktkejefqxprbccg',
      },
    });
  }

  async sendMail({ to, subject, html }) {
    if (!to) {
      return;
    }
    return await this.transporter.sendMail({
      from: {
        name: '聊天室',
        address: '2016316854@qq.com',
      },
      to,
      subject,
      html,
    });
  }
}
