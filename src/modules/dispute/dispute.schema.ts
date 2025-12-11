import { z } from "zod";

export const createDisputeSchema = z.object({
  reason: z.string().min(5, "Reason is required (min 5 chars)"),
  description: z.string().optional(),
});

// Schema for resolving a dispute
export const resolveDisputeSchema = z.object({
  resolution: z.enum(["REFUND_TENANT", "PAYOUT_LANDLORD", "REJECT_DISPUTE"], {
    message:
      "Invalid resolution type. Must be REFUND_TENANT, PAYOUT_LANDLORD, or REJECT_DISPUTE.",
  }),
  adminNotes: z
    .string()
    .min(5, "Admin notes are required to explain the decision."),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
