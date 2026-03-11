'use client';

import { QuadrantIndex, RotationDirection } from '@/types/game';
import { cn } from '@/lib/utils';

interface QuadrantControlsProps {
  onRotate: (quadrant: QuadrantIndex, direction: RotationDirection) => void;
  disabled?: boolean;
}

const QUADRANT_NAMES = ['Sol Üst', 'Sağ Üst', 'Sol Alt', 'Sağ Alt'];

export default function QuadrantControls({ onRotate, disabled }: QuadrantControlsProps) {
  return (
    <div className="w-full max-w-[360px] mx-auto">
      <p className="text-center text-sm text-white/60 mb-3 font-medium">
        Bir çeyreği döndür
      </p>
      <div className="grid grid-cols-2 gap-3">
        {([0, 1, 2, 3] as QuadrantIndex[]).map((q) => (
          <div
            key={q}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-xl',
              'bg-white/5 border border-white/10',
              disabled && 'opacity-40'
            )}
          >
            <span className="text-xs font-semibold text-white/70">{QUADRANT_NAMES[q]}</span>
            <div className="flex gap-2">
              {/* Counter-clockwise */}
              <button
                onClick={() => !disabled && onRotate(q, 'ccw')}
                disabled={disabled}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center text-lg',
                  'bg-indigo-500/20 border border-indigo-400/30 text-indigo-300',
                  'transition-all duration-150',
                  !disabled && 'hover:bg-indigo-500/40 hover:scale-110 active:scale-95 cursor-pointer'
                )}
                aria-label={`Döndür: çeyrek ${q + 1} sola`}
                title="Sola döndür (↺)"
              >
                ↺
              </button>
              {/* Clockwise */}
              <button
                onClick={() => !disabled && onRotate(q, 'cw')}
                disabled={disabled}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center text-lg',
                  'bg-purple-500/20 border border-purple-400/30 text-purple-300',
                  'transition-all duration-150',
                  !disabled && 'hover:bg-purple-500/40 hover:scale-110 active:scale-95 cursor-pointer'
                )}
                aria-label={`Döndür: çeyrek ${q + 1} sağa`}
                title="Sağa döndür (↻)"
              >
                ↻
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
