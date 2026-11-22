import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, Database } from 'firebase/database';
import { AuctionState, Player } from '../types';
import { getAppConfig } from './config';
import { SAMPLE_PLAYERS_BY_CATEGORY } from '../data/mockData';

let app: FirebaseApp | null = null;
let db: Database | null = null;
let broadcastChannel: BroadcastChannel | null = null;

const STATE_STORAGE_KEY = 'AUCTION_LOCAL_STATE';

const initialPlayers: Player[] = (SAMPLE_PLAYERS_BY_CATEGORY['Category A'] || []).map((name, idx) => ({
  id: `p-${idx}-${Date.now()}`,
  name,
  category: 'Category A',
  status: 'inAuction',
}));

export const DEFAULT_AUCTION_STATE: AuctionState = {
  currentCategory: 'Category A',
  inAuction: initialPlayers,
  sold: [],
  unsold: [],
  wheelState: {
    isSpinning: false,
    targetRotation: 0,
    durationMs: 4000,
    selectedPlayer: null,
    winnerModalOpen: false,
    spinTimestamp: 0,
  },
  lastUpdated: Date.now(),
};

function initFirebase() {
  const config = getAppConfig();
  if (config.firebaseConfig && config.firebaseConfig.databaseURL) {
    try {
      if (!getApps().length) {
        app = initializeApp(config.firebaseConfig);
      } else {
        app = getApps()[0];
      }
      db = getDatabase(app);
      return true;
    } catch (e) {
      console.warn('Firebase init error, falling back to local sync:', e);
    }
  }
  return false;
}

// Initialize BroadcastChannel for cross-tab fallback
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('auction_sync');
}

export function isFirebaseConnected(): boolean {
  return db !== null;
}

export function subscribeToAuctionState(onStateChange: (state: AuctionState) => void): () => void {
  const hasFirebase = initFirebase();

  if (hasFirebase && db) {
    const stateRef = ref(db, 'auction_state');
    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          // Normalize arrays (Firebase sometimes converts arrays to objects or drops empty arrays)
          const normalized: AuctionState = {
            currentCategory: val.currentCategory || 'Category A',
            inAuction: Array.isArray(val.inAuction) ? val.inAuction : Object.values(val.inAuction || {}),
            sold: Array.isArray(val.sold) ? val.sold : Object.values(val.sold || {}),
            unsold: Array.isArray(val.unsold) ? val.unsold : Object.values(val.unsold || {}),
            wheelState: val.wheelState || DEFAULT_AUCTION_STATE.wheelState,
            lastUpdated: val.lastUpdated || Date.now(),
          };
          onStateChange(normalized);
          localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(normalized));
        } else {
          // Initialize DB if empty
          publishAuctionState(DEFAULT_AUCTION_STATE);
          onStateChange(DEFAULT_AUCTION_STATE);
        }
      },
      (error) => {
        console.error('Firebase read error:', error);
      }
    );

    return () => unsubscribe();
  }

  // Fallback: LocalStorage + BroadcastChannel
  const getStoredState = (): AuctionState => {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return DEFAULT_AUCTION_STATE;
  };

  onStateChange(getStoredState());

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'AUCTION_STATE_UPDATE') {
      onStateChange(event.data.state);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STATE_STORAGE_KEY && event.newValue) {
      try {
        onStateChange(JSON.parse(event.newValue));
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

export async function publishAuctionState(state: AuctionState): Promise<void> {
  const updatedState: AuctionState = {
    ...state,
    lastUpdated: Date.now(),
  };

  localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(updatedState));

  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'AUCTION_STATE_UPDATE',
      state: updatedState,
    });
  }

  if (db) {
    try {
      const stateRef = ref(db, 'auction_state');
      await set(stateRef, updatedState);
    } catch (e) {
      console.error('Error writing to Firebase:', e);
    }
  }
}
