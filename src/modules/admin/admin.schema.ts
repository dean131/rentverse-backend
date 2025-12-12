import { z } from "zod";

// 1. List Users
export const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["TENANT", "LANDLORD", "ALL"]).optional(),
  kycStatus: z
    .enum(["PENDING", "VERIFIED", "REJECTED", "SUBMITTED"])
    .optional(),
});

// 2. Verify User (KYC)
export const verifyUserSchema = z
  .object({
    status: z.enum(["VERIFIED", "REJECTED"], {
      message: "Status must be either VERIFIED or REJECTED",
    }),
    // Allow null explicitly for JSON payloads
    rejectionReason: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Logic: If Rejected, Reason is mandatory.
      if (data.status === "REJECTED" && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: "Rejection reason is required when status is REJECTED",
      path: ["rejectionReason"],
    }
  );

// 3. Adjust Trust Score
export const adjustTrustSchema = z.object({
  userId: z.string().uuid("Invalid User ID"),
  role: z.enum(["TENANT", "LANDLORD"], {
    message: "Role must be TENANT or LANDLORD",
  }),
  scoreDelta: z
    .number()
    .int()
    .refine((val) => val !== 0, {
      message: "Score delta cannot be zero",
    }),
  reason: z.string().min(5, "Reason is required (min 5 chars)"),
});

// Property Verification
export const verifyPropertySchema = z
  .object({
    isVerified: z.boolean(),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isVerified === false && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: "Rejection reason is required when rejecting a property",
      path: ["rejectionReason"],
    }
  );

export type VerifyPropertyInput = z.infer<typeof verifyPropertySchema>;
export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type VerifyUserInput = z.infer<typeof verifyUserSchema>;
export type AdjustTrustInput = z.infer<typeof adjustTrustSchema>;
