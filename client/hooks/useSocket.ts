'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import {
  GameStartPayload,
  GameStatePayload,
  OpponentDisconnectedPayload,
  RoomCreatedPayload,
  ErrorPayload,
  PlaceStonePayload,
  RotateQuadrantPayload,
  JoinRoomPayload,
  RejoinRoomPayload,
} from '@/types/game';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const forfeitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    setGameState,
    setRoomCode,
    setMyColor,
    setConnectionStatus,
    setForfeitCountdown,
  } = useGameStore();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('room_created', (payload: RoomCreatedPayload) => {
      setRoomCode(payload.roomCode);
      setMyColor(payload.color);
    });

    socket.on('game_start', (payload: GameStartPayload) => {
      setGameState(payload.gameState);
      setMyColor(payload.color);
      setRoomCode(payload.roomCode);
      // Clear any existing forfeit countdown
      if (forfeitIntervalRef.current) {
        clearInterval(forfeitIntervalRef.current);
        forfeitIntervalRef.current = null;
        setForfeitCountdown(null);
      }
    });

    socket.on('game_state', (payload: GameStatePayload) => {
      setGameState(payload.gameState);
    });

    socket.on('opponent_disconnected', (payload: OpponentDisconnectedPayload) => {
      toast.warning('Rakip bağlantısı koptu, bekleniyor...', {
        duration: payload.forfeitCountdownSeconds * 1000,
      });
      let remaining = payload.forfeitCountdownSeconds;
      setForfeitCountdown(remaining);
      forfeitIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setForfeitCountdown(remaining);
        if (remaining <= 0) {
          if (forfeitIntervalRef.current) clearInterval(forfeitIntervalRef.current);
          forfeitIntervalRef.current = null;
        }
      }, 1000);
    });

    socket.on('opponent_reconnected', () => {
      toast.success('Rakip yeniden bağlandı!');
      if (forfeitIntervalRef.current) {
        clearInterval(forfeitIntervalRef.current);
        forfeitIntervalRef.current = null;
        setForfeitCountdown(null);
      }
    });

    socket.on('error', (payload: ErrorPayload) => {
      toast.error(payload.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_created');
      socket.off('game_start');
      socket.off('game_state');
      socket.off('opponent_disconnected');
      socket.off('opponent_reconnected');
      socket.off('error');
    };
  }, [setGameState, setRoomCode, setMyColor, setConnectionStatus, setForfeitCountdown]);

  const createRoom = useCallback(() => {
    socketRef.current?.emit('create_room', {});
  }, []);

  const joinRoom = useCallback((payload: JoinRoomPayload) => {
    socketRef.current?.emit('join_room', payload);
  }, []);

  const rejoinRoom = useCallback((payload: RejoinRoomPayload) => {
    socketRef.current?.emit('rejoin_room', payload);
  }, []);

  const placeStone = useCallback((payload: PlaceStonePayload) => {
    socketRef.current?.emit('place_stone', payload);
  }, []);

  const rotateQuadrant = useCallback((payload: RotateQuadrantPayload) => {
    socketRef.current?.emit('rotate_quadrant', payload);
  }, []);

  return { createRoom, joinRoom, rejoinRoom, placeStone, rotateQuadrant };
}
