'use client';

import { useCallback } from 'react';
import { Board, PlayerColor, QuadrantIndex, RotationDirection } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  board: Board;
  myColor: PlayerColor;
  currentTurn: PlayerColor;
  phase: 'waiting' | 'place_stone' | 'rotate' | 'game_over';
  lastStoneQuadrant: QuadrantIndex | null;
  onCellClick: (row: number, col: number) => void;
  onRotate: (quadrant: QuadrantIndex, direction: RotationDirection) => void;
}

const Q_OFFSET: Record<QuadrantIndex, [number, number]> = {
  0: [0, 0],
  1: [0, 3],
  2: [3, 0],
  3: [3, 3],
};

export default function GameBoard({
  board,
  myColor,
  currentTurn,
  phase,
  onCellClick,
  onRotate,
}: GameBoardProps) {
  const isMyTurn = myColor === currentTurn;
  const canPlace = isMyTurn && phase === 'place_stone';
  const canRotate = isMyTurn && phase === 'rotate';

  const pendingRotation = useGameStore((s) => s.pendingRotation);
  const startRotation = useGameStore((s) => s.startRotation);
  const finishRotation = useGameStore((s) => s.finishRotation);

  const handleRotate = useCallback(
    (quadrant: QuadrantIndex, direction: RotationDirection) => {
      if (!canRotate || pendingRotation) return;
      startRotation(quadrant, direction);
      onRotate(quadrant, direction);
    },
    [canRotate, pendingRotation, startRotation, onRotate]
  );

  const onAnimEnd = useCallback(() => {
    finishRotation();
  }, [finishRotation]);

  return (
    <div className="relative mx-auto select-none" style={{ width: 'min(92vw, 380px)' }}>
      {/* Board frame */}
      <div
        style={{
          aspectRatio: '1',
          background: 'radial-gradient(ellipse at 30% 20%, #6b3a1f 0%, #4a2209 40%, #2e1206 100%)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 0 0 2px #7c4a20, 0 0 0 4px #3d1a06, 0 12px 50px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,200,100,0.12)',
          position: 'relative',
        }}
      >
        {/* Grain */}
        <div
          className="absolute inset-0 rounded-[16px] pointer-events-none opacity-30"
          style={{
            background: 'repeating-linear-gradient(92deg, transparent 0px, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 7px)',
          }}
        />

        {/* Quadrant grid */}
        <div
          className="relative w-full h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 5px 1fr',
            gridTemplateRows: '1fr 5px 1fr',
          }}
        >
          {/* Cross dividers */}
          <div style={{ gridColumn: '2', gridRow: '1 / 4', background: 'linear-gradient(to right, #2e1206, #5c2d0e, #2e1206)', borderRadius: '2px', zIndex: 2 }} />
          <div style={{ gridColumn: '1 / 4', gridRow: '2', background: 'linear-gradient(to bottom, #2e1206, #5c2d0e, #2e1206)', borderRadius: '2px', zIndex: 2 }} />

          {([0, 1, 2, 3] as QuadrantIndex[]).map((q) => {
            const [rowOffset, colOffset] = Q_OFFSET[q];
            const isAnimating = pendingRotation?.quadrant === q;
            const animCls = isAnimating
              ? pendingRotation.direction === 'cw' ? 'quadrant-cw' : 'quadrant-ccw'
              : '';

            return (
              <div
                key={q}
                className="relative"
                style={{ gridColumn: q % 2 === 0 ? 1 : 3, gridRow: q < 2 ? 1 : 3 }}
              >
                <div
                  className={cn('w-full h-full rounded-full', animCls)}
                  style={{
                    transformOrigin: 'center center',
                    background: 'radial-gradient(ellipse at 35% 30%, #1c4a2a 0%, #0d2e17 60%, #071a0d 100%)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 5px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)',
                    padding: '8%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(3, 1fr)',
                    gap: '6%',
                  }}
                  onAnimationEnd={isAnimating ? onAnimEnd : undefined}
                >
                  {[0, 1, 2].map((r) =>
                    [0, 1, 2].map((c) => {
                      const row = rowOffset + r;
                      const col = colOffset + c;
                      const cell = board[row][col];
                      const clickable = canPlace && cell === null;

                      return (
                        <button
                          key={`${row}-${col}`}
                          onClick={() => clickable && onCellClick(row, col)}
                          disabled={!clickable}
                          className={cn(
                            'relative rounded-full flex items-center justify-center',
                            clickable && 'cursor-pointer hover:brightness-150 active:scale-95'
                          )}
                          style={{
                            aspectRatio: '1',
                            background: cell ? 'transparent' : 'radial-gradient(circle at 40% 35%, #0a2010 0%, #061409 60%, #030a06 100%)',
                            boxShadow: cell ? 'none' : 'inset 0 2px 6px rgba(0,0,0,0.9), inset 0 1px 2px rgba(0,0,0,0.5)',
                            borderRadius: '50%',
                            transition: 'transform 80ms ease',
                          }}
                          aria-label={`Hücre ${row}-${col}`}
                        >
                          {cell === 'white' && (
                            <div
                              className="absolute inset-[6%] rounded-full animate-[popIn_0.2s_ease-out]"
                              style={{
                                background: 'radial-gradient(circle at 35% 28%, #ffffff 0%, #e8e8e8 35%, #b0b0b0 100%)',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08)',
                              }}
                            />
                          )}
                          {cell === 'black' && (
                            <div
                              className="absolute inset-[6%] rounded-full animate-[popIn_0.2s_ease-out]"
                              style={{
                                background: 'radial-gradient(circle at 30% 22%, #555 0%, #1a1a1a 40%, #050505 100%)',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.06)',
                              }}
                            />
                          )}
                          {!cell && clickable && (
                            <div
                              className="absolute inset-[12%] rounded-full opacity-0 hover:opacity-40 transition-opacity duration-150"
                              style={{
                                background: myColor === 'white'
                                  ? 'radial-gradient(circle, #fff, #aaa)'
                                  : 'radial-gradient(circle, #555, #111)',
                              }}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROTATION PANEL ── */}
      {canRotate && !pendingRotation && (
        <div className="mt-6 w-full animate-[fadeSlideUp_0.25s_ease-out]">
          <p className="text-center text-sm text-white/40 mb-3 uppercase tracking-[0.15em] font-semibold">
            Çeyrek Döndür
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {([0, 1, 2, 3] as QuadrantIndex[]).map((q) => {
              const labels = ['Sol Üst', 'Sağ Üst', 'Sol Alt', 'Sağ Alt'];
              const [qr, qc] = Q_OFFSET[q];
              let empty = true;
              for (let r = qr; r < qr + 3 && empty; r++)
                for (let c = qc; c < qc + 3 && empty; c++)
                  if (board[r][c] !== null) empty = false;

              return (
                <div
                  key={q}
                  className={cn(
                    'flex items-center justify-between rounded-2xl px-4 py-3 transition-opacity duration-200',
                    empty && 'opacity-25 cursor-not-allowed'
                  )}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span className="text-xs font-bold text-white/45 tracking-wide">{labels[q]}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => !empty && handleRotate(q, 'ccw')}
                      disabled={empty}
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-100',
                        empty
                          ? 'cursor-not-allowed text-white/15'
                          : 'cursor-pointer hover:bg-white/15 hover:scale-105 active:scale-90 active:bg-white/20 text-white/60'
                      )}
                      title={empty ? 'Boş çeyrek döndürülemez' : 'Sola döndür'}
                    >
                      ↺
                    </button>
                    <button
                      onClick={() => !empty && handleRotate(q, 'cw')}
                      disabled={empty}
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-100',
                        empty
                          ? 'cursor-not-allowed text-white/15'
                          : 'cursor-pointer hover:bg-white/15 hover:scale-105 active:scale-90 active:bg-white/20 text-white/60'
                      )}
                      title={empty ? 'Boş çeyrek döndürülemez' : 'Sağa döndür'}
                    >
                      ↻
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
