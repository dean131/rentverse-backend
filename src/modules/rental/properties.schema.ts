import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().optional(),
  
  // Coerce numbers because multipart/form-data sends everything as strings
  propertyTypeId: z.coerce.number().int().positive(),
  listingTypeId: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
  currency: z.string().default('IDR'),
  
  // Location Data
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().default('Indonesia'),
  
  // Optional Coordinates
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  // Amenities: Handle both JSON string (from Postman/Mobile) and raw array
  amenities: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return []; 
      }
    }
    return val;
  }, z.array(z.string())).optional().default([]),

  // Relations: Billing Periods (Monthly, Yearly, etc.)
  billingPeriodIds: z.preprocess((val) => {
    if (typeof val === 'string') return JSON.parse(val);
    return val;
  }, z.array(z.number().int()).nonempty("At least one billing period is required")),

  // EAV Attributes (Dynamic Specs)
  attributes: z.preprocess((val) => {
    if (typeof val === 'string') return JSON.parse(val);
    return val;
  }, z.array(
    z.object({
      attributeTypeId: z.number().int(),
      value: z.any().transform(String), // Ensure value is stored as string
    })
  )).optional().default([]),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;