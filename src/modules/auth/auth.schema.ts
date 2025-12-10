import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(10, "Phone number must be valid").optional(),
  role: z.enum(["TENANT", "LANDLORD"], {
    message: "Role must be either 'TENANT' or 'LANDLORD'",
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  phone: z.string().min(10, "Phone number must be valid").optional(),
});

export const sendOtpSchema = z.object({
  target: z.string().min(5, "Valid Email or Phone is required"),
  channel: z.enum(["EMAIL", "WHATSAPP"], {
    message: "Channel must be EMAIL or WHATSAPP",
  }),
});

export const verifyOtpSchema = z.object({
  target: z.string().min(5),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
