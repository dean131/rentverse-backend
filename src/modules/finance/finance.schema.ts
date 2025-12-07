import { z } from "zod";

export const payoutRequestSchema = z.object({
  amount: z.number().positive().min(50000, "Minimum withdrawal is 50,000"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNo: z.string().min(5, "Account number is required"),
  accountName: z.string().min(3, "Account holder name is required"),
  notes: z.string().optional(),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;