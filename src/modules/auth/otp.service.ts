import redis from "../../config/redis.js";
import crypto from "crypto";
import { otpQueue } from "./otp.queue.js"; // Import Queue

class OtpService {
  /**
   * 1. Generate & Store OTP (Sync) -> Send (Async)
   */
  async sendOtp(target: string, channel: "EMAIL" | "WHATSAPP") {
    // A. Generate 6-digit numeric code
    const otp = crypto.randomInt(100000, 999999).toString();
    const key = `OTP:${channel}:${target}`;

    // B. Store in Redis (Expires in 5 minutes = 300s)
    // We do this BEFORE queuing to ensure the code is valid even if the worker is fast
    await redis.set(key, otp, "EX", 300);

    // C. [CHANGED] Add to Queue for Delivery
    await otpQueue.add("sendOtp", {
      target,
      channel,
      otp,
    });

    return { message: `OTP sent to ${target} via ${channel}` };
  }

  /**
   * 2. Verify OTP (Remains Synchronous)
   */
  async verifyOtp(target: string, channel: "EMAIL" | "WHATSAPP", code: string) {
    const key = `OTP:${channel}:${target}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp) {
      return false; // Invalid or Expired
    }

    if (storedOtp !== code) {
      return false; // Wrong Code
    }

    // Success! Delete the key so it can't be reused (Replay Attack Protection)
    await redis.del(key);

    return true;
  }
}

export default new OtpService();
