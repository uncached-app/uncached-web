import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface ReclaimedStepProps {
  count: number;
  size: string;
  onReset: () => void;
}

export default function ReclaimedStep({ count, size, onReset }: ReclaimedStepProps) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const burst = (origin: { x: number; y: number }, angle: number) => {
      confetti({ particleCount: 28, angle, spread: 48, startVelocity: 22, gravity: 1.2, origin, colors: ['#b9d98d', '#ffc2b5', '#edf0eb'], zIndex: 100 });
    };

    burst({ x: 0.5, y: 0.65 }, 90);
    const firstTimer = setTimeout(() => burst({ x: 0.28, y: 0.72 }, 65), 500);
    const secondTimer = setTimeout(() => burst({ x: 0.72, y: 0.72 }, 115), 1000);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="grid size-12 sm:size-16 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent"><Check size={26} strokeWidth={2} /></motion.div>
      <h2 className="mt-3 sm:mt-5 text-2xl sm:text-4xl font-semibold tracking-tight text-text-primary">Space reclaimed</h2>
      <p className="mt-1.5 max-w-xs text-xs sm:text-sm leading-relaxed text-text-muted">{count} {count === 1 ? 'target' : 'targets'} moved to the Recycle Bin.</p>
      <div className="mt-4 sm:mt-6 flex gap-3 sm:gap-4">
        <div className="rounded-xl sm:rounded-2xl border border-border-theme bg-canvas px-4 py-2.5 sm:px-6 sm:py-3.5 text-left"><span className="block text-[10px] sm:text-xs uppercase tracking-wider text-text-muted">Targets reclaimed</span><strong className="mt-0.5 sm:mt-1 block text-lg sm:text-2xl text-text-primary font-mono">{count}</strong></div>
        <div className="rounded-xl sm:rounded-2xl border border-border-theme bg-canvas px-4 py-2.5 sm:px-6 sm:py-3.5 text-left"><span className="block text-[10px] sm:text-xs uppercase tracking-wider text-text-muted">Space reclaimed</span><strong className="mt-0.5 sm:mt-1 block text-lg sm:text-2xl text-accent font-mono">{size}</strong></div>
      </div>
      <button type="button" onClick={onReset} className="mt-5 sm:mt-6 inline-flex min-h-9 sm:min-h-10 items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 sm:px-6 text-xs sm:text-sm font-semibold text-accent-text transition-colors cursor-pointer"><RotateCcw size={14} /><span>Scan another workspace</span></button>
    </div>
  );
}
