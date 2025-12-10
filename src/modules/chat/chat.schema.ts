import { z } from "zod";

export const startChatSchema = z.object({
  propertyId: z.string().uuid("Invalid Property ID format"),
});

//  Schema for listing conversations
export const getConversationsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

export const getMessagesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
export type GetConversationsQuery = z.infer<typeof getConversationsSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesSchema>;
