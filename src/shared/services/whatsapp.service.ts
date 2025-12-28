import axios from "axios";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

class WhatsappService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.WAHA_API_URL;
    this.apiKey = env.WAHA_API_KEY;
  }

  async sendOtp(phone: string, otp: string) {
    try {
      // 1. Format Phone: Remove non-digits, ensure country code (62 for ID)
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.slice(1);
      }

      // WAHA uses "@c.us" suffix for chat IDs
      const chatId = `${formattedPhone}@c.us`;

      // 2. Send Request
      await axios.post(
        `${this.baseUrl}/api/sendText`,
        {
          session: "default", // WAHA creates a 'default' session automatically
          chatId: chatId,
          text: `*Rentverse Verification*\n\nYour OTP is: *${otp}*\n\nDo not share this code.`,
        },
        {
          headers: {
            "X-Api-Key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`[WhatsApp] OTP sent to ${formattedPhone}`);
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      const msg = error.message;

      logger.error(`[WhatsApp] Failed to send. Status: ${status} | Error: ${JSON.stringify(data)} | Msg: ${msg}`);
      throw new Error(`WhatsApp Error: ${JSON.stringify(data) || msg}`);
    }
  }
}

export default new WhatsappService();