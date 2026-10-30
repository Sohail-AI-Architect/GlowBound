'use client';

import { Button } from '@/components/ui/Button';
import type { GameMode } from '@/lib/game/engine';
import type { ShareStatus } from '@/lib/utils/share';
import { formatDuration, formatScore } from '@/lib/utils/format';

export interface RunSummary {
  score: number;
  level: number;
  gems: number;
  bestCombo: number;
  elapsed: number;
  mode: GameMode;
  isNewBest: boolean;
  best: number;
  dateKey: string;
}

const SHARE_LABEL: Record<ShareStatus, string> = {
  shared: 'Shared',
  copied: 'Copied to clipboard',
  dismissed: 'Share score',
  unsupported: 'Sharing unavailable',
  error: 'Copy failed — try again',
};

interface GameOverProps {
  summary: RunSummary;
  shareStatus: ShareStatus | null;
  onShare: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

export function GameOver({ summary, shareStatus, onShare, onRestart, onMenu }: GameOverProps) {
  const shareLabel = shareStatus ? SHARE_LABEL[shareStatus] : 'Share score';
  const shareDisabled = shareStatus === 'unsupported';

  return (
    <div
      data-testid="game-over"
      role="dialog"
      aria-modal="true"
      aria-label="Run results"
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-void-950/75 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-void-900/90 p-5 shadow-2xl sm:p-7">
        <div className="text-center">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            {summary.mode === 'daily' ? 'Daily challenge complete' : 'Run complete'}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-bold tracking-wider text-white">
            {summary.isNewBest ? 'NEW PERSONAL BEST' : 'GAME OVER'}
          </h2>
          <p
            className="mt-3 font-display text-5xl font-bold text-transparent"
            style={{
              backgroundImage: 'linear-gradient(100deg, #7fd8ff, #a78bfa 55%, #f472b6)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            {formatScore(summary.score)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Personal best {formatScore(summary.best)}
            {summary.mode === 'daily' ? ' today' : ''}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat label="Gems" value={String(summary.gems)} />
          <Stat label="Best combo" value={`${summary.bestCombo}x`} />
          <Stat label="Level" value={String(summary.level)} />
          <Stat label="Survived" value={formatDuration(summary.elapsed)} />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={onRestart} size="lg" autoFocus>
            Play again
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onShare} disabled={shareDisabled}>
              {shareLabel}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onMenu}>
              Menu
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="mt-3 text-center text-[0.65rem] text-slate-400">
          {shareStatus === 'unsupported'
            ? "This browser can't share or copy — you can still screenshot your score."
            : 'Scores are stored in this browser. No global leaderboard, no account.'}
        </p>
      </div>
    </div>
  );
}
