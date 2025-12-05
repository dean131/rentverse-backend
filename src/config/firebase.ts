import admin from 'firebase-admin';
import logger from './logger.js';

let firebaseApp: admin.app.App | null = null;

try {
  // In production, we would use: admin.credential.cert(serviceAccount)
  // For local dev without creds, we initialize a mock or check env vars
  if (process.env.FIREBASE_CREDENTIALS_PATH) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    logger.info('[Firebase] FCM Initialized successfully');
  } else {
    logger.warn('[Firebase] No credentials found. Push notifications will be MOCKED.');
  }
} catch (error) {
  logger.error('[Firebase] Failed to initialize:', error);
}

export const fcm = firebaseApp ? firebaseApp.messaging() : null;