import { AppConfig } from '../types';

const STORAGE_KEY = 'AUCTION_CUSTOM_CONFIG';
const PASSCODE_KEY = 'AUCTION_ADMIN_AUTH';

const DEFAULT_SHEET_ID = '1q4KIQ4McbSTIHsKTEW3gaDG__tVBiG0lIXJOc5qGaEY';

export function getAppConfig(): AppConfig {
  const saved = localStorage.getItem(STORAGE_KEY);
  let customConfig: Partial<AppConfig> = {};
  if (saved) {
    try {
      customConfig = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  const env = import.meta.env;

  const firebaseConfig = customConfig.firebaseConfig || (
    env.VITE_FIREBASE_API_KEY ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: env.VITE_FIREBASE_DATABASE_URL || '',
      projectId: env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
    } : undefined
  );

  return {
    firebaseConfig,
    googleSheetId: customConfig.googleSheetId || env.VITE_GOOGLE_SHEET_ID || DEFAULT_SHEET_ID,
    adminPasscode: customConfig.adminPasscode || env.VITE_ADMIN_PASSCODE || 'auction2026',
  };
}

export function saveAppConfig(config: Partial<AppConfig>) {
  const current = getAppConfig();
  const merged = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  // Dispatch custom event so listeners can reinitialize
  window.dispatchEvent(new Event('auction-config-updated'));
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(PASSCODE_KEY) === 'true';
}

export function setAdminAuthenticated(auth: boolean) {
  if (auth) {
    sessionStorage.setItem(PASSCODE_KEY, 'true');
  } else {
    sessionStorage.removeItem(PASSCODE_KEY);
  }
}
