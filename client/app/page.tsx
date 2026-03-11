'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

type ModalState = 'none' | 'join' | 'rules' | 'waiting';

export default function HomePage() {
  const [modal, setModal] = useState<ModalState>('none');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { createRoom, joinRoom } = useSocket();
  const { roomCode, gameState } = useGameStore();
  const router = useRouter();

  // Navigate when game starts
  useEffect(() => {
    if (gameState && gameState.phase !== 'waiting' && roomCode) {
      router.push(`/game/${roomCode}`);
    }
  }, [gameState, roomCode, router]);

  const handleCreate = () => {
    createRoom();
    setModal('waiting');
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 5) {
      toast.error('Oda kodu 5 karakter olmalı!');
      return;
    }
    joinRoom({ roomCode: code });
    setModal('none');
  };

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Ambient background glow */}
      <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0e30 0%, #080510 70%)' }} />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full -z-10 opacity-20" style={{ background: 'radial-gradient(circle, #6c3ce0 0%, transparent 70%)' }} />

      {/* Logo area */}
      <div className="text-center mb-12 animate-[fadeSlideUp_0.5s_ease-out]">
        {/* Board icon */}
        <div className="mx-auto mb-5 w-20 h-20 rounded-2xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #4a2209 0%, #6b3a1f 50%, #4a2209 100%)',
          boxShadow: '0 8px 32px rgba(74,34,9,0.5), inset 0 1px 0 rgba(255,200,100,0.2)',
        }}>
          <div className="grid grid-cols-2 gap-0.5">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-3.5 h-3.5 rounded-full" style={{
                background: i % 2 === 0
                  ? 'radial-gradient(circle at 35% 30%, #fff, #bbb)'
                  : 'radial-gradient(circle at 35% 30%, #555, #111)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }} />
            ))}
          </div>
        </div>

        <h1 className="text-5xl font-black text-white tracking-tight mb-1.5">PENTAGO</h1>
        <p className="text-white/30 text-sm tracking-widest uppercase">Online Strateji</p>
      </div>

      {/* Action panel */}
      <div className="w-full max-w-xs space-y-3 animate-[fadeSlideUp_0.5s_ease-out_0.1s_both]">
        <button
          onClick={handleCreate}
          className="w-full h-14 rounded-2xl text-white font-bold text-base tracking-wide cursor-pointer transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_40px_rgba(108,60,224,0.4)] active:translate-y-0 active:shadow-[0_4px_20px_rgba(108,60,224,0.3)]"
          style={{
            background: 'linear-gradient(135deg, #6c3ce0 0%, #8b5cf6 50%, #6c3ce0 100%)',
            boxShadow: '0 6px 28px rgba(108,60,224,0.35)',
          }}
        >
          Oda Kur
        </button>

        <button
          onClick={() => setModal('join')}
          className="w-full h-14 rounded-2xl text-white/80 font-bold text-base tracking-wide cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-[0.98]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          Odaya Katıl
        </button>

        <button
          onClick={() => setModal('rules')}
          className="w-full h-10 text-white/30 text-xs font-medium tracking-wider uppercase cursor-pointer transition-colors hover:text-white/60"
        >
          Nasıl Oynanır?
        </button>
      </div>

      {/* ─── WAITING MODAL ─── */}
      <Dialog open={modal === 'waiting'}>
        <DialogContent
          className="max-w-xs rounded-2xl border-0 text-center"
          style={{
            background: 'linear-gradient(180deg, #12101f 0%, #0b0914 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          }}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Oda Hazır</DialogTitle>
            <DialogDescription className="text-white/40 text-xs">Bu kodu rakibinle paylaş</DialogDescription>
          </DialogHeader>

          <div
            className="text-4xl font-black tracking-[0.35em] py-5 rounded-xl"
            style={{
              background: 'rgba(108,60,224,0.08)',
              border: '1px solid rgba(108,60,224,0.15)',
              color: '#a78bfa',
            }}
          >
            {roomCode || '·····'}
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-11 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)',
            }}
          >
            {copied ? '✓ Kopyalandı' : 'Kodu Kopyala'}
          </button>

          <div className="flex items-center justify-center gap-2 text-white/30 text-xs py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Rakip bekleniyor
          </div>

          <button
            onClick={() => { setModal('none'); useGameStore.getState().reset(); }}
            className="text-white/20 text-[11px] cursor-pointer hover:text-white/40 transition-colors"
          >
            İptal
          </button>
        </DialogContent>
      </Dialog>

      {/* ─── JOIN MODAL ─── */}
      <Dialog open={modal === 'join'} onOpenChange={(o) => !o && setModal('none')}>
        <DialogContent
          className="max-w-xs rounded-2xl border-0"
          style={{
            background: 'linear-gradient(180deg, #12101f 0%, #0b0914 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Odaya Katıl</DialogTitle>
            <DialogDescription className="text-white/40 text-xs">5 haneli oda kodunu gir</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="A7B9X"
              className="text-center text-2xl font-black tracking-[0.3em] h-14 rounded-xl border-white/8 bg-white/5 text-white placeholder:text-white/15"
              maxLength={5}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoFocus
            />
            <button
              onClick={handleJoin}
              className="w-full h-12 rounded-xl text-white font-bold cursor-pointer transition-all duration-150 hover:translate-y-[-1px] active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #6c3ce0 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 20px rgba(108,60,224,0.3)',
              }}
            >
              Katıl
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── RULES MODAL ─── */}
      <Dialog open={modal === 'rules'} onOpenChange={(o) => !o && setModal('none')}>
        <DialogContent
          className="max-w-sm rounded-2xl border-0"
          style={{
            background: 'linear-gradient(180deg, #12101f 0%, #0b0914 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Nasıl Oynanır?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-white/50 text-sm leading-relaxed">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-[10px] font-black bg-purple-500/20 text-purple-300">1</span>
              <p>6×6 tahtada 4 döndürülebilir 3×3 çeyrek var.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-[10px] font-black bg-purple-500/20 text-purple-300">2</span>
              <p>Sıra sende: Önce boş bir hücreye taş koy.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-[10px] font-black bg-purple-500/20 text-purple-300">3</span>
              <p>Sonra herhangi bir çeyreği 90° döndür.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-[10px] font-black bg-purple-500/20 text-purple-300">★</span>
              <p>Yatay, dikey veya çapraz 5 taşı arka arkaya dizen kazanır!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
