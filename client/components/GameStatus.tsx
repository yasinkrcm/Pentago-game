'use client';

import { GamePhase, PlayerColor } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameStatusProps {
  phase: GamePhase;
  myColor: PlayerColor;
  currentTurn: PlayerColor;
  forfeitCountdown: number | null;
  moveCount: number;
}

export default function GameStatus({ phase, myColor, currentTurn, forfeitCountdown }: GameStatusProps) {
  const isMyTurn = myColor === currentTurn;

  if (phase === 'waiting') {
    return (
      <div className="text-center py-3">
        <div className="flex items-center justify-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-sm text-white/35 font-medium">Rakip bekleniyor</span>
        </div>
      </div>
    );
  }

  if (phase === 'game_over') return null;

  return (
    <div className="text-center py-2">
      <div
        className={cn(
          'inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold tracking-wide',
          isMyTurn ? 'text-white' : 'text-white/35'
        )}
        style={
          isMyTurn
            ? {
                background: 'linear-gradient(135deg, rgba(108,60,224,0.18) 0%, rgba(139,92,246,0.12) 100%)',
                border: '1px solid rgba(108,60,224,0.25)',
                boxShadow: '0 0 30px rgba(108,60,224,0.08)',
              }
            : {
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }
        }
      >
        {isMyTurn ? (
          phase === 'place_stone' ? (
            '🎯  Taş koy'
          ) : (
            '🔄  Çeyrek döndür'
          )
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
            Rakip oynuyor
          </>
        )}
      </div>

      {forfeitCountdown !== null && forfeitCountdown > 0 && (
        <div className="mt-2.5 text-xs font-semibold text-orange-400/80 animate-pulse">
          Rakip {forfeitCountdown}s içinde dönmezse hükmen galipsin
        </div>
      )}
    </div>
  );
}
