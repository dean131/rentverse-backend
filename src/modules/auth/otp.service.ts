import redis from "../../config/redis.js"; // Assuming you have a redis client exported
import crypto from "crypto";
import AppError from "../../shared/utils/AppError.js";
import emailService from "../../shared/services/email.service.js"; // We will build this
import whatsappService from "../../shared/services/whatsapp.service.js"; // We will build this

class OtpService {
  /**
   * 1. Generate & Store OTP
   */
  async sendOtp(target: string, channel: "EMAIL" | "WHATSAPP") {
    // A. Generate 6-digit numeric code
    const otp = crypto.randomInt(100000, 999999).toString();
    const key = `OTP:${channel}:${target}`;

    // B. Store in Redis (Expires in 5 minutes = 300s)
    // "EX" sets expiry in seconds
    await redis.set(key, otp, "EX", 300);

    // C. Send via Channel
    if (channel === "EMAIL") {
      await emailService.sendOtp(target, otp);
    } else {
      await whatsappService.sendOtp(target, otp);
    }

    return { message: `OTP sent to ${target} via ${channel}` };
  }

  /**
   * 2. Verify OTP
   */
  async verifyOtp(target: string, channel: "EMAIL" | "WHATSAPP", code: string) {
    const key = `OTP:${channel}:${target}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp) {
      throw new AppError("OTP expired or invalid", 400);
    }

    if (storedOtp !== code) {
      throw new AppError("Invalid OTP code", 400);
    }

    // Success! Delete the key so it can't be reused
    await redis.del(key);

    return true;
  }
}

export default new OtpService();
