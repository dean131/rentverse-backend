import { z } from "zod";

export const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["TENANT", "LANDLORD", "ALL"]).optional(),
  kycStatus: z.enum(["PENDING", "VERIFIED", "REJECTED", "SUBMITTED"]).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;