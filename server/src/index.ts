import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocketId,
  handleDisconnect,
  processPlaceStone,
  processRotateQuadrant,
} from './roomManager';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  PlaceStonePayload,
  RotateQuadrantPayload,
  RejoinRoomPayload,
} from './types';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const FORFEIT_SECONDS = 30;

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ─────────────────────────────────────────────
  // CREATE ROOM
  // ─────────────────────────────────────────────
  socket.on('create_room', (_payload: CreateRoomPayload) => {
    const room = createRoom(socket.id);
    socket.join(room.roomCode);
    socket.emit('room_created', {
      roomCode: room.roomCode,
      color: 'white',
    });
    console.log(`[Room] Created: ${room.roomCode} by ${socket.id}`);
  });

  // ─────────────────────────────────────────────
  // JOIN ROOM
  // ─────────────────────────────────────────────
  socket.on('join_room', (payload: JoinRoomPayload) => {
    const { roomCode } = payload;
    const result = joinRoom(roomCode, socket.id);

    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }

    const { room, color } = result;
    socket.join(roomCode);

    // If second player joined and both players are present → game starts
    if (room.gameState.players.length === 2) {
      // Tell new joiner their color
      socket.emit('game_start', {
        gameState: room.gameState,
        color,
        roomCode,
      });

      // Tell the room creator
      const creator = room.gameState.players.find((p) => p.color === 'white');
      if (creator) {
        const creatorSocket = io.sockets.sockets.get(creator.id);
        if (creatorSocket) {
          creatorSocket.emit('game_start', {
            gameState: room.gameState,
            color: 'white',
            roomCode,
          });
        }
      }

      console.log(`[Room] Game started in: ${roomCode}`);
    } else {
      // Reconnecting player
      socket.emit('game_start', {
        gameState: room.gameState,
        color,
        roomCode,
      });
      // Notify others that opponent reconnected
      socket.to(roomCode).emit('opponent_reconnected');
    }
  });

  // ─────────────────────────────────────────────
  // REJOIN ROOM (page refresh)
  // ─────────────────────────────────────────────
  socket.on('rejoin_room', (payload: RejoinRoomPayload) => {
    const { roomCode, color } = payload;
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    const player = room.gameState.players.find((p) => p.color === color);
    if (!player) {
      socket.emit('error', { message: 'Player not found in room.' });
      return;
    }

    // Cancel forfeit timer
    if (room.forfeitTimer) {
      clearTimeout(room.forfeitTimer);
      room.forfeitTimer = undefined;
    }

    player.id = socket.id;
    player.connected = true;
    socket.join(roomCode);

    socket.emit('game_start', {
      gameState: room.gameState,
      color,
      roomCode,
    });

    socket.to(roomCode).emit('opponent_reconnected');
    console.log(`[Room] Player rejoined: ${roomCode} as ${color}`);
  });

  // ─────────────────────────────────────────────
  // PLACE STONE
  // ─────────────────────────────────────────────
  socket.on('place_stone', (payload: PlaceStonePayload) => {
    const { roomCode, row, col } = payload;
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    const result = processPlaceStone(room, socket.id, row, col);
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }

    io.to(roomCode).emit('game_state', { gameState: result.gameState });
    console.log(`[Move] Stone placed at [${row},${col}] in room ${roomCode}`);
  });

  // ─────────────────────────────────────────────
  // ROTATE QUADRANT
  // ─────────────────────────────────────────────
  socket.on('rotate_quadrant', (payload: RotateQuadrantPayload) => {
    const { roomCode, quadrant, direction } = payload;
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    const result = processRotateQuadrant(room, socket.id, quadrant, direction);
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }

    io.to(roomCode).emit('game_state', { gameState: result.gameState });
    console.log(
      `[Move] Quadrant ${quadrant} rotated ${direction} in room ${roomCode}` +
        (result.winnerColor ? ` → Winner: ${result.winnerColor}` : '')
    );
  });

  // ─────────────────────────────────────────────
  // DISCONNECT
  // ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);

    const result = handleDisconnect(socket.id, (roomCode, winnerColor) => {
      // Forfeit: notify everyone in the room
      const room = getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('game_state', { gameState: room.gameState });
        console.log(`[Forfeit] Room ${roomCode} → ${winnerColor} wins by forfeit`);
      }
    });

    if (result) {
      const { room, disconnectedColor } = result;
      // Only notify if game was in progress
      if (room.gameState.phase !== 'game_over') {
        io.to(room.roomCode).emit('opponent_disconnected', {
          forfeitCountdownSeconds: FORFEIT_SECONDS,
        });
      }
    }
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Pentago server running on http://localhost:${PORT}`);
});
