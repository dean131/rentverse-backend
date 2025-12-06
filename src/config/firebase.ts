import admin from 'firebase-admin';
import logger from './logger.js';
import { env } from './env.js'; 

let firebaseApp: admin.app.App | null = null;

try {
  if (env.FIREBASE_CREDENTIALS_PATH) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(env.FIREBASE_CREDENTIALS_PATH),
    });
    logger.info('[Firebase] FCM Initialized successfully');
  } else {
    logger.warn('[Firebase] No credentials path provided. Push notifications will be MOCKED.');
  }
} catch (error) {
  logger.error('[Firebase] Failed to initialize:', error);
}

export const fcm = firebaseApp ? firebaseApp.messaging() : null;