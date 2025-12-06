import midtransClient from 'midtrans-client';
import { env } from './env.js';

// Initialize Core API (for checking status)
export const coreApi = new midtransClient.CoreApi({
  isProduction: false, // Sandbox Environment
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

// Initialize Snap API (for UI payment page)
export const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});