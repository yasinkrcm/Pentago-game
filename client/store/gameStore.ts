import { create } from 'zustand';
import {
  GameState,
  PlayerColor,
  ConnectionStatus,
  QuadrantIndex,
  RotationDirection,
} from '@/types/game';

interface PendingRotation {
  quadrant: QuadrantIndex;
  direction: RotationDirection;
}

interface GameStore {
  gameState: GameState | null;
  roomCode: string | null;
  myColor: PlayerColor | null;
  connectionStatus: ConnectionStatus;
  forfeitCountdown: number | null;
  hydrated: boolean;

  // Animation buffering
  pendingRotation: PendingRotation | null;
  bufferedGameState: GameState | null;

  setGameState: (gs: GameState) => void;
  setRoomCode: (code: string) => void;
  setMyColor: (color: PlayerColor) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setForfeitCountdown: (seconds: number | null) => void;

  // Animation helpers
  startRotation: (quadrant: QuadrantIndex, direction: RotationDirection) => void;
  finishRotation: () => void;

  // Session persistence
  hydrate: () => void;
  reset: () => void;
}

function saveSession(roomCode: string | null, myColor: PlayerColor | null) {
  if (typeof window === 'undefined') return;
  try {
    if (roomCode && myColor) {
      localStorage.setItem('pentago_session', JSON.stringify({ roomCode, myColor }));
    } else {
      localStorage.removeItem('pentago_session');
    }
  } catch {}
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  roomCode: null,
  myColor: null,
  connectionStatus: 'disconnected',
  forfeitCountdown: null,
  hydrated: false,
  pendingRotation: null,
  bufferedGameState: null,

  setGameState: (gs) => {
    const { pendingRotation } = get();
    if (pendingRotation) {
      // Animation is playing — buffer the state, apply when animation ends
      set({ bufferedGameState: gs });
    } else {
      set({ gameState: gs, bufferedGameState: null });
    }
  },

  setRoomCode: (code) => {
    set({ roomCode: code });
    saveSession(code, get().myColor);
  },
  setMyColor: (color) => {
    set({ myColor: color });
    saveSession(get().roomCode, color);
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setForfeitCountdown: (seconds) => set({ forfeitCountdown: seconds }),

  startRotation: (quadrant, direction) => {
    set({ pendingRotation: { quadrant, direction } });
  },

  finishRotation: () => {
    const { bufferedGameState } = get();
    set({
      pendingRotation: null,
      bufferedGameState: null,
      ...(bufferedGameState ? { gameState: bufferedGameState } : {}),
    });
  },

  // Called once on client mount — reads localStorage
  hydrate: () => {
    if (get().hydrated) return;
    try {
      const data = localStorage.getItem('pentago_session');
      if (data) {
        const { roomCode, myColor } = JSON.parse(data);
        set({ roomCode, myColor, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  reset: () => {
    saveSession(null, null);
    set({
      gameState: null,
      roomCode: null,
      myColor: null,
      connectionStatus: 'disconnected',
      forfeitCountdown: null,
      pendingRotation: null,
      bufferedGameState: null,
    });
  },
}));
