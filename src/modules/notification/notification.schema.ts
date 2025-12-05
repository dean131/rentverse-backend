import { z } from "zod";

export const registerDeviceSchema = z.object({
  fcmToken: z.string().min(10, "Valid FCM Token is required"),
  platform: z.enum(["ANDROID", "IOS", "WEB"], {
    message: "Platform must be ANDROID, IOS, or WEB",
  }),
  deviceModel: z.string().optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;