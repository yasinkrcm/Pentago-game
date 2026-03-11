'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlayerColor } from '@/types/game';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

interface GameOverDialogProps {
  open: boolean;
  winner: PlayerColor | 'draw' | null;
  myColor: PlayerColor;
}

export default function GameOverDialog({ open, winner, myColor }: GameOverDialogProps) {
  const router = useRouter();
  const reset = useGameStore((s) => s.reset);

  const isWinner = winner === myColor;
  const isDraw = winner === 'draw';

  const emoji = isDraw ? '🤝' : isWinner ? '🎉' : '💀';
  const title = isDraw ? 'Berabere' : isWinner ? 'Kazandın!' : 'Kaybettin';
  const sub = isDraw
    ? 'Her iki oyuncu da aynı anda 5 taşı dizdi.'
    : isWinner
    ? 'Tebrikler, 5 taşı arka arkaya dizdin!'
    : 'Rakibin 5 taşı arka arkaya dizdi.';

  const handleHome = () => {
    reset();
    router.push('/');
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-xs rounded-2xl border-0 text-center"
        style={{
          background: 'linear-gradient(180deg, #12101f 0%, #0b0914 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        }}
        showCloseButton={false}
      >
        <DialogHeader className="space-y-1 pt-2">
          <div className="text-5xl mb-1">{emoji}</div>
          <DialogTitle
            className="text-2xl font-black"
            style={{
              color: isDraw ? '#facc15' : isWinner ? '#4ade80' : '#f87171',
            }}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/35 text-xs">
            {sub}
          </DialogDescription>
        </DialogHeader>

        {!isDraw && winner && (
          <div className="flex items-center justify-center gap-2 my-1">
            <div className={`w-4 h-4 rounded-full ${winner === 'white' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-gray-900 border border-gray-600'}`} />
            <span className="text-white/30 text-xs">{winner === 'white' ? 'Beyaz' : 'Siyah'} kazandı</span>
          </div>
        )}

        <button
          onClick={handleHome}
          className="w-full h-12 rounded-xl text-white font-bold text-sm cursor-pointer transition-all duration-150 hover:translate-y-[-1px] active:translate-y-0 mt-2"
          style={{
            background: 'linear-gradient(135deg, #6c3ce0 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 20px rgba(108,60,224,0.3)',
          }}
        >
          Ana Sayfaya Dön
        </button>
      </DialogContent>
    </Dialog>
  );
}
