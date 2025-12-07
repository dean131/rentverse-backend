import midtransClient from 'midtrans-client';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

// Core API: Used for server-to-server status checks (Webhooks)
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

// Snap API: Used to generate the payment popup/token
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});