// Shared types between client and server

export type Cell = 'white' | 'black' | null;
export type Board = Cell[][];
export type QuadrantIndex = 0 | 1 | 2 | 3;
export type RotationDirection = 'cw' | 'ccw';
export type PlayerColor = 'white' | 'black';
export type GamePhase = 'waiting' | 'place_stone' | 'rotate' | 'game_over';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface Player {
  id: string;
  color: PlayerColor;
  connected: boolean;
}

export interface GameState {
  board: Board;
  currentTurn: PlayerColor;
  phase: GamePhase;
  winner: PlayerColor | 'draw' | null;
  players: Player[];
  moveCount: number;
  lastStoneQuadrant: QuadrantIndex | null; // which quadrant the current player placed in (must rotate this one)
}

export interface RoomState {
  roomCode: string;
  gameState: GameState;
  forfeitTimer?: ReturnType<typeof setTimeout>;
}

// Socket event payloads
export interface CreateRoomPayload {
  playerName?: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName?: string;
}

export interface PlaceStonePayload {
  roomCode: string;
  row: number;
  col: number;
}

export interface RotateQuadrantPayload {
  roomCode: string;
  quadrant: QuadrantIndex;
  direction: RotationDirection;
}

export interface RejoinRoomPayload {
  roomCode: string;
  color: PlayerColor;
}

// Server → Client events
export interface RoomCreatedPayload {
  roomCode: string;
  color: PlayerColor;
}

export interface GameStartPayload {
  gameState: GameState;
  color: PlayerColor;
  roomCode: string;
}

export interface GameStatePayload {
  gameState: GameState;
}

export interface OpponentDisconnectedPayload {
  forfeitCountdownSeconds: number;
}

export interface ErrorPayload {
  message: string;
}
