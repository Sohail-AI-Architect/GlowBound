'use client';

import { Button } from '@/components/ui/Button';
import { formatScore } from '@/lib/utils/format';

interface PauseScreenProps {
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function PauseScreen({ score, onResume, onRestart, onQuit }: PauseScreenProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game paused"
      className="absolute inset-0 z-30 flex items-center justify-center bg-void-950/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-void-900/90 p-6 text-center shadow-2xl">
        <h2 className="font-display text-2xl font-bold tracking-wider text-white">PAUSED</h2>
        <p className="mt-1 text-sm text-slate-400">
          Score <span className="font-semibold text-white tabular-nums">{formatScore(score)}</span>
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={onResume} autoFocus>
            Resume
          </Button>
          <Button variant="secondary" onClick={onRestart}>
            Restart run
          </Button>
          <Button variant="ghost" onClick={onQuit}>
            Quit to menu
          </Button>
        </div>
        <p className="mt-4 text-[0.65rem] text-slate-400">Press P or Escape to resume</p>
      </div>
    </div>
  );
}
