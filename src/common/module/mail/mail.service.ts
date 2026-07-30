import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendConfirmEmail(email: string, otp: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Confirm your email',
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 15 minutes.</p>`,
      });
    } catch (error) {
      this.logger.warn(`Failed to send confirm email to ${email}: ${error}`);
    }
  }

  async sendForgotPassword(email: string, token: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password',
        html: `<p>Use this token to reset your password: <strong>${token}</strong></p><p>This token expires in 1 hour.</p>`,
      });
    } catch (error) {
      this.logger.warn(`Failed to send reset email to ${email}: ${error}`);
    }
  }

  async sendOrderConfirmation(email: string, orderId: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Order confirmation',
        html: `<p>Thank you for your order!</p><p>Order ID: <strong>${orderId}</strong></p>`,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send order confirmation to ${email}: ${error}`,
      );
    }
  }
}
