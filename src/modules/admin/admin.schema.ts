import { z } from "zod";

export const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["TENANT", "LANDLORD", "ALL"]).optional(),
  kycStatus: z
    .enum(["PENDING", "VERIFIED", "REJECTED", "SUBMITTED"])
    .optional(),
});

export const verifyUserSchema = z
  .object({
    status: z.enum(["VERIFIED", "REJECTED"], {
      message: "Status must be either VERIFIED or REJECTED",
    }),
    // Add .nullable() to allow explicitly sending null
    rejectionReason: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // If status is REJECTED, reason is mandatory (cannot be null, undefined, or empty)
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

export type VerifyUserInput = z.infer<typeof verifyUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersSchema>;
