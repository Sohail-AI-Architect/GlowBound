'use client';

import type { GameSnapshot } from '@/lib/game/engine';

function IconButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-void-900/80 text-slate-200 backdrop-blur transition hover:border-neon-300/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-300"
    >
      {children}
    </button>
  );
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.5" />
      <rect x="14" y="5" width="4" height="14" rx="1.5" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function SoundIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" fill="currentColor" stroke="none" />
      {enabled ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18 6a8.5 8.5 0 0 1 0 12" />
        </>
      ) : (
        <>
          <path d="M16 9.5l5 5" />
          <path d="M21 9.5l-5 5" />
        </>
      )}
    </svg>
  );
}

function Hearts({ hp, maxHp }: { hp: number; maxHp: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`${hp} of ${maxHp} health remaining`}
    >
      {Array.from({ length: maxHp }, (_, index) => (
        <span
          key={index}
          className={
            index < hp
              ? 'h-2.5 w-2.5 rounded-full bg-magenta-400 shadow-[0_0_10px_2px_rgba(244,114,182,0.75)]'
              : 'h-2.5 w-2.5 rounded-full bg-white/15'
          }
        />
      ))}
    </div>
  );
}

interface GameHUDProps {
  snapshot: GameSnapshot;
  best: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
}

export function GameHUD({ snapshot, best, soundEnabled, onToggleSound, onTogglePause }: GameHUDProps) {
  const isPaused = snapshot.phase === 'paused';
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
      <div className="rounded-2xl border border-white/10 bg-void-950/55 px-3.5 py-2 backdrop-blur">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Score</p>
        <p
          data-testid="hud-score"
          className="font-display text-2xl font-bold leading-tight text-white tabular-nums sm:text-3xl"
        >
          {snapshot.score.toLocaleString('en-US')}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] font-medium text-slate-300">
          <span>Best {best.toLocaleString('en-US')}</span>
          <span aria-hidden="true" className="text-slate-600">|</span>
          <span>Level {snapshot.level}</span>
          {snapshot.multiplier > 1 && (
            <span className="rounded-full bg-gradient-to-r from-electric-400 to-magenta-400 px-2 py-0.5 font-display text-[0.6rem] font-bold text-void-950">
              {snapshot.multiplier}x
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex items-center gap-2">
          <IconButton label={soundEnabled ? 'Mute sound' : 'Unmute sound'} pressed={!soundEnabled} onClick={onToggleSound}>
            <SoundIcon enabled={soundEnabled} />
          </IconButton>
          <IconButton label={isPaused ? 'Resume game' : 'Pause game'} onClick={onTogglePause}>
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </IconButton>
        </div>
        <Hearts hp={snapshot.hp} maxHp={snapshot.maxHp} />
      </div>
    </div>
  );
}
