import { z } from "zod";

export const kycSubmissionSchema = z.object({
  idCardNumber: z.string().min(16, "ID Card number must be valid (16 digits)"),
  fullName: z.string().min(3),
});

export type KycSubmissionInput = z.infer<typeof kycSubmissionSchema>;