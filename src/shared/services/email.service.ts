import nodemailer from "nodemailer";
import { env } from "../../config/env.js"; // Assuming env vars are loaded here
import logger from "../../config/logger.js";

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || "mailpit",
      port: Number(env.SMTP_PORT) || 1025,
      secure: false,
      auth: {
        user: env.SMTP_USER || "none",
        pass: env.SMTP_PASS || "none",
      },
    });
  }

  async sendOtp(to: string, otp: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"Rentverse Security" <security@rentverse.com>',
        to,
        subject: "Your Verification Code",
        text: `Your Rentverse OTP is: ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Rentverse Verification</h2>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
            <p>This code expires in 5 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      logger.info(`[Email] OTP sent to ${to}. MessageId: ${info.messageId}`);
    } catch (error) {
      logger.error("[Email] Failed to send OTP:", error);
      throw new Error("Failed to send email");
    }
  }
}

export default new EmailService();
