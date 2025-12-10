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
}

export type EventKey = keyof EventMap;
