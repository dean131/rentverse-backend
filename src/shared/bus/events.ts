/**
 * THE EVENT CONTRACT
 * Defines the payload types for every event in the system.
 */
export interface EventMap {
  // AUTH EVENTS
  'AUTH:USER_REGISTERED': { 
    userId: string; 
    email: string; 
    role: 'TENANT' | 'LANDLORD' 
  };
  
  // TRUST EVENTS (Internal or External)
  'TRUST:SCORE_CHANGED': { 
    userId: string; 
    newScore: number; 
    reason: string 
  };

  // KYC Events
  'KYC:SUBMITTED': { 
    userId: string; 
    role: string 
  };
}

export type EventKey = keyof EventMap;