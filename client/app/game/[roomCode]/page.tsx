'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/GameBoard';
import GameStatus from '@/components/GameStatus';
import GameOverDialog from '@/components/GameOverDialog';
import { Toaster } from 'sonner';
import { QuadrantIndex, RotationDirection } from '@/types/game';
import { cn } from '@/lib/utils';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const { placeStone, rotateQuadrant, rejoinRoom } = useSocket();
  const { gameState, myColor, forfeitCountdown, connectionStatus, hydrated, hydrate, reset } =
    useGameStore();

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-rejoin on page refresh (F5)
  // Waits for: hydration done + socket connected + no game state yet + has color from localStorage
  useEffect(() => {
    if (hydrated && connectionStatus === 'connected' && !gameState && myColor) {
      console.log('[Rejoin] Attempting rejoin:', roomCode, myColor);
      rejoinRoom({ roomCode, color: myColor });
    }
  }, [hydrated, connectionStatus, gameState, myColor, roomCode, rejoinRoom]);

  // If no session exists after hydration (user navigated directly), go home
  useEffect(() => {
    if (hydrated && connectionStatus === 'connected' && !myColor) {
      router.push('/');
    }
  }, [hydrated, connectionStatus, myColor, router]);

  const handleCellClick = (row: number, col: number) => {
    if (!gameState || !myColor) return;
    if (gameState.phase !== 'place_stone') return;
    if (gameState.currentTurn !== myColor) return;
    placeStone({ roomCode, row, col });
  };

  const handleRotate = (quadrant: QuadrantIndex, direction: RotationDirection) => {
    if (!gameState || !myColor) return;
    if (gameState.phase !== 'rotate') return;
    if (gameState.currentTurn !== myColor) return;
    rotateQuadrant({ roomCode, quadrant, direction });
  };

  const handleExit = () => {
    reset(); // clears localStorage + zustand state
    router.push('/');
  };

  // Loading state
  if (!gameState) {
    return (
      <main
        className="min-h-[100dvh] flex items-center justify-center p-6"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0e30 0%, #080510 70%)' }}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin mx-auto mb-5" />
          <p className="text-white/40 text-base">Bağlanılıyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-6 relative"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #12081f 0%, #080510 60%)' }}
    >
      <Toaster position="top-center" richColors />

      {/* Top bar — fixed at top */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
        <button
          onClick={handleExit}
          className="text-white/30 text-sm font-medium cursor-pointer hover:text-white/60 transition-colors active:scale-95"
        >
          ← Çıkış
        </button>

        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span className="text-xs text-white/25 uppercase tracking-wider font-medium">Oda</span>
          <span className="text-sm font-black tracking-[0.2em] text-white/60">{roomCode}</span>
        </div>

        {myColor && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div
              className={cn(
                'w-4 h-4 rounded-full',
                myColor === 'white'
                  ? 'bg-gradient-to-br from-white to-gray-200 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                  : 'bg-gradient-to-br from-gray-700 to-black border border-gray-600'
              )}
            />
            <span className="font-semibold">{myColor === 'white' ? 'Beyaz' : 'Siyah'}</span>
          </div>
        )}
      </div>

      {/* Main content — centered */}
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Status */}
        <div className="w-full mb-5">
          <GameStatus
            phase={gameState.phase}
            myColor={myColor!}
            currentTurn={gameState.currentTurn}
            forfeitCountdown={forfeitCountdown}
            moveCount={gameState.moveCount}
          />
        </div>

        {/* Board */}
        <div className="w-full">
          <GameBoard
            board={gameState.board}
            myColor={myColor!}
            currentTurn={gameState.currentTurn}
            phase={gameState.phase}
            lastStoneQuadrant={gameState.lastStoneQuadrant}
            onCellClick={handleCellClick}
            onRotate={handleRotate}
          />
        </div>

        {/* Players */}
        <div className="w-full mt-6 flex justify-center gap-4">
          {gameState.players.map((p) => (
            <div
              key={p.id}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                gameState.currentTurn === p.color && gameState.phase !== 'game_over'
                  ? 'bg-purple-500/12 border border-purple-400/25 shadow-[0_0_20px_rgba(108,60,224,0.1)]'
                  : 'bg-white/[0.03] border border-white/[0.06]'
              )}
            >
              <div
                className={cn(
                  'w-3.5 h-3.5 rounded-full',
                  p.color === 'white'
                    ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]'
                    : 'bg-gray-800 border border-gray-600'
                )}
              />
              <span className="text-white/50">
                {p.color === myColor ? 'Sen' : 'Rakip'}
              </span>
              {!p.connected && (
                <span className="text-orange-400 text-xs font-semibold animate-pulse">çevrimdışı</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Game Over */}
      <GameOverDialog
        open={gameState.phase === 'game_over'}
        winner={gameState.winner}
        myColor={myColor!}
      />
    </main>
  );
}
