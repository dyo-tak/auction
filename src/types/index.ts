export type PlayerStatus = 'inAuction' | 'sold' | 'unsold';

export interface Player {
  id: string;
  name: string;
  category?: string;
  status: PlayerStatus;
  team?: string;
  bidAmount?: number;
  addedAt?: number;
}

export interface WheelState {
  isSpinning: boolean;
  targetRotation: number; // in degrees
  durationMs: number; // spin duration in ms
  selectedPlayer: Player | null;
  winnerModalOpen: boolean;
  spinTimestamp: number;
}

export interface AuctionState {
  currentCategory: string;
  inAuction: Player[];
  sold: Player[];
  unsold: Player[];
  wheelState: WheelState;
  lastUpdated: number;
}

export interface TeamSlot {
  category: string;
  playerName: string;
  bidAmount: number;
}

export interface TeamPurse {
  id: string;
  name: string;
  logoUrl?: string;
  color: string;
  secondaryColor?: string;
  totalPurse: number;
  spent: number;
  remaining: number;
  slots: TeamSlot[];
}

export interface AppConfig {
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  googleSheetId?: string;
  adminPasscode?: string;
}
