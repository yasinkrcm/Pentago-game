import { GameState, Player, PlayerColor, QuadrantIndex, RoomState } from './types';
import { checkWin, createBoard, isBoardFull } from './gameEngine';

function getQuadrantForCell(row: number, col: number): QuadrantIndex {
  if (row < 3 && col < 3) return 0;
  if (row < 3 && col >= 3) return 1;
  if (row >= 3 && col < 3) return 2;
  return 3;
}

const rooms = new Map<string, RoomState>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function createInitialGameState(players: Player[]): GameState {
  return {
    board: createBoard(),
    currentTurn: 'white',
    phase: players.length < 2 ? 'waiting' : 'place_stone',
    winner: null,
    players,
    moveCount: 0,
    lastStoneQuadrant: null,
  };
}

export function createRoom(socketId: string): RoomState {
  const roomCode = generateRoomCode();
  const players: Player[] = [{ id: socketId, color: 'white', connected: true }];
  const gameState = createInitialGameState(players);
  const room: RoomState = { roomCode, gameState };
  rooms.set(roomCode, room);
  return room;
}

export function joinRoom(
  roomCode: string,
  socketId: string
): { room: RoomState; color: PlayerColor } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };
  if (room.gameState.players.length >= 2) {
    const existingPlayer = room.gameState.players.find((p) => !p.connected);
    if (!existingPlayer) return { error: 'Room is full.' };
    // Reconnection path
    existingPlayer.id = socketId;
    existingPlayer.connected = true;
    if (room.forfeitTimer) {
      clearTimeout(room.forfeitTimer);
      room.forfeitTimer = undefined;
    }
    return { room, color: existingPlayer.color };
  }

  const newPlayer: Player = { id: socketId, color: 'black', connected: true };
  room.gameState.players.push(newPlayer);
  room.gameState.phase = 'place_stone';
  return { room, color: 'black' };
}

export function getRoom(roomCode: string): RoomState | undefined {
  return rooms.get(roomCode);
}

export function getRoomBySocketId(socketId: string): RoomState | undefined {
  for (const room of rooms.values()) {
    if (room.gameState.players.some((p) => p.id === socketId)) {
      return room;
    }
  }
  return undefined;
}

export function handleDisconnect(
  socketId: string,
  onForfeit: (roomCode: string, winnerColor: PlayerColor) => void
): { room: RoomState; disconnectedColor: PlayerColor } | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const player = room.gameState.players.find((p) => p.id === socketId);
  if (!player) return null;

  player.connected = false;

  const FORFEIT_SECONDS = 30;
  room.forfeitTimer = setTimeout(() => {
    if (room.gameState.phase !== 'game_over') {
      const winnerColor: PlayerColor = player.color === 'white' ? 'black' : 'white';
      room.gameState.phase = 'game_over';
      room.gameState.winner = winnerColor;
      onForfeit(room.roomCode, winnerColor);
    }
  }, FORFEIT_SECONDS * 1000);

  return { room, disconnectedColor: player.color };
}

export function processPlaceStone(
  room: RoomState,
  socketId: string,
  row: number,
  col: number
): { error: string } | { gameState: GameState } {
  const { gameState } = room;
  const player = gameState.players.find((p) => p.id === socketId);
  if (!player) return { error: 'Player not in room.' };
  if (gameState.phase !== 'place_stone') return { error: 'Not the placement phase.' };
  if (gameState.currentTurn !== player.color) return { error: 'Not your turn.' };
  if (gameState.board[row]?.[col] !== null) return { error: 'Cell is already occupied.' };
  if (row < 0 || row > 5 || col < 0 || col > 5) return { error: 'Invalid cell position.' };

  const newBoard = gameState.board.map((r) => [...r]);
  newBoard[row][col] = player.color;
  gameState.board = newBoard;
  gameState.phase = 'rotate';
  gameState.moveCount++;
  gameState.lastStoneQuadrant = getQuadrantForCell(row, col);

  return { gameState };
}

export function processRotateQuadrant(
  room: RoomState,
  socketId: string,
  quadrant: 0 | 1 | 2 | 3,
  direction: 'cw' | 'ccw'
): { error: string } | { gameState: GameState; winnerColor: PlayerColor | 'draw' | null } {
  const { gameState } = room;
  const player = gameState.players.find((p) => p.id === socketId);
  if (!player) return { error: 'Player not in room.' };
  if (gameState.phase !== 'rotate') return { error: 'Not the rotation phase.' };
  if (gameState.currentTurn !== player.color) return { error: 'Not your turn.' };

  // Check quadrant is not empty
  const qRowStart = quadrant < 2 ? 0 : 3;
  const qColStart = quadrant % 2 === 0 ? 0 : 3;
  let hasStone = false;
  for (let r = qRowStart; r < qRowStart + 3; r++) {
    for (let c = qColStart; c < qColStart + 3; c++) {
      if (gameState.board[r][c] !== null) { hasStone = true; break; }
    }
    if (hasStone) break;
  }
  if (!hasStone) return { error: 'Boş çeyrek döndürülemez.' };

  // Rotate
  const { rotateQuadrant } = require('./gameEngine');
  gameState.board = rotateQuadrant(gameState.board, quadrant, direction);

  // Check win
  const { winner } = checkWin(gameState.board);
  if (winner) {
    gameState.phase = 'game_over';
    gameState.winner = winner;
    return { gameState, winnerColor: winner };
  }

  // Check draw
  if (isBoardFull(gameState.board)) {
    gameState.phase = 'game_over';
    gameState.winner = 'draw';
    return { gameState, winnerColor: 'draw' };
  }

  // Switch turn
  gameState.currentTurn = player.color === 'white' ? 'black' : 'white';
  gameState.phase = 'place_stone';
  gameState.lastStoneQuadrant = null;

  return { gameState, winnerColor: null };
}

export function deleteRoom(roomCode: string): void {
  rooms.delete(roomCode);
}
