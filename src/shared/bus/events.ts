import { ChatMessage } from "@prisma/client";

/**
 * THE EVENT CONTRACT
 * Defines the payload types for every event in the system.
 */
export interface EventMap {
  // AUTH EVENTS
  "AUTH:USER_REGISTERED": {
    userId: string;
    email: string;
    role: "TENANT" | "LANDLORD";
  };

  // TRUST EVENTS (Internal or External)
  "TRUST:SCORE_CHANGED": {
    userId: string;
    newScore: number;
    reason: string;
  };

  // KYC Events
  "KYC:SUBMITTED": {
    userId: string;
    role: string;
  };

  // Booking Events
  "BOOKING:CREATED": {
    bookingId: string;
    landlordId: string;
    tenantId: string;
    propertyTitle: string;
  };

  // Payment Events
  "PAYMENT:PAID": {
    invoiceId: string;
    bookingId: string;
    tenantId: string;
    amount: number;
    paidAt: Date;
  };

  "PAYMENT:FAILED": {
    invoiceId: string;
    reason: string;
  };

  // Chat Events
  "CHAT:MESSAGE_SENT": {
    messageId: string;
    roomId: string;
    senderId: string;
    content: string;
    createdAt: Date;
  };

  // Booking Decisions
  "BOOKING:CONFIRMED": {
    bookingId: string;
    tenantId: string;
    propertyTitle: string;
  };

  "BOOKING:REJECTED": {
    bookingId: string;
    tenantId: string;
    propertyTitle: string;
    reason: string;
  };

  //  Admin Actions
  "KYC:VERIFIED": {
    userId: string;
    role: string; // "TENANT" | "LANDLORD"
    adminId: string; // For audit log
  };

  "KYC:REJECTED": {
    userId: string;
    role: string;
    adminId: string;
    reason: string;
  };

  //  Governance Events
  "ADMIN:TRUST_SCORE_ADJUSTED": {
    adminId: string;
    userId: string;
    role: "TENANT" | "LANDLORD";
    scoreDelta: number;
    reason: string;
  };

  // [NEW] Review Events
  "REVIEW:CREATED": {
    reviewId: string;
    bookingId: string;
    reviewerId: string; // Who wrote it
    receiverId: string; // Who received it (Target)
    role: "TENANT" | "LANDLORD"; // Role of the REVIEWER
    rating: number;
  };
  
  "PROPERTY:VERIFIED": {
    propertyId: string;
    landlordId: string;
    title: string;
  };

  "PROPERTY:REJECTED": {
    propertyId: string;
    landlordId: string;
    title: string;
    reason: string;
  };

  "CHAT:MESSAGE_PROCESSED": {
    message: ChatMessage; // Or 'any' if types aren't generated yet
    roomId: string;
    senderId: string;
    receiverId: string;
    tempId?: string; // For optimistic UI updates on client
  };
}

export type EventKey = keyof EventMap;
