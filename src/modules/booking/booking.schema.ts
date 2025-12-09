import { z } from 'zod';

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  billingPeriodId: z.number().int().positive(),
  startDate: z.string().datetime(), // ISO 8601 string
});

// Reject Booking Schema
export const rejectBookingSchema = z.object({
  reason: z.string().min(5, "Rejection reason is required (min 5 chars)"),
});

export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;