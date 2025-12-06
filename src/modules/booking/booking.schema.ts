import { z } from 'zod';

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  billingPeriodId: z.number().int().positive(),
  startDate: z.string().datetime(), // ISO 8601 string
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;