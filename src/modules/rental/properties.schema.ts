import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(5),
  description: z.string().optional(),
  propertyTypeId: z.coerce.number(),
  listingTypeId: z.coerce.number(),
  price: z.coerce.number().positive(),
  currency: z.string().default('IDR'),
  
  // Location
  address: z.string(),
  city: z.string(),
  country: z.string().default('Indonesia'),
  
  // Coordinates (Optional)
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  // Amenities (Optional Array of Strings)
  // handle '["WIFI", "POOL"]' (JSON string) OR ["WIFI", "POOL"] (raw array)
  amenities: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return [val]; // Fallback for single value
      }
    }
    return val;
  }, z.array(z.string())).optional().default([]),

  // Relations
  billingPeriodIds: z.preprocess((val) => {
    if (typeof val === 'string') return JSON.parse(val);
    return val;
  }, z.array(z.number())),

  attributes: z.preprocess((val) => {
    if (typeof val === 'string') return JSON.parse(val);
    return val;
  }, z.array(
    z.object({
      attributeTypeId: z.number(),
      value: z.any().transform(String),
    })
  )),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;