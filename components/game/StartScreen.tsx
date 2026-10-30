'use client';

import { Button } from '@/components/ui/Button';
import type { GameMode } from '@/lib/game/engine';
import { cn } from '@/lib/utils/cn';
import { formatDailyDate, formatScore } from '@/lib/utils/format';

interface StartScreenProps {
  mode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  best: number;
  dailyBest: number;
  dateKey: string;
  onStart: () => void;
}

const TUTORIAL = [
  {
    title: 'Steer the orb',
    detail: 'Move with your mouse, drag on touch screens, or use the arrow keys / WASD.',
  },
  {
    title: 'Collect energy gems',
    detail: 'Every gem adds points and extends your combo. Every fourth gem raises the multiplier.',
  },
  {
    title: 'Dodge everything else',
    detail: 'Pink shards, red drones and laser gates cost a heart. Lose three and the run ends.',
  },
];

function ModeTab({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-1 rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-300',
        active
          ? 'border-electric-300/70 bg-electric-400/15 text-white shadow-glow'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white',
      )}
    >
      <span className="block font-display text-sm font-semibold tracking-wide">{title}</span>
      <span className="mt-0.5 block text-[0.66rem] leading-snug text-slate-400">{subtitle}</span>
    </button>
  );
}

export function StartScreen({
  mode,
  onChangeMode,
  best,
  dailyBest,
  dateKey,
  onStart,
}: StartScreenProps) {
  return (
    <div
      role="dialog"
      aria-label="GlowBound start screen"
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-void-950/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-void-900/85 p-5 shadow-2xl sm:p-7">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-electric-300">
          Neon arcade survival
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-wider text-white sm:text-4xl">
          GLOWBOUND
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Guide the orb, chain gems, stay alive. One hit breaks your combo — three end the run.
        </p>

        <div className="mt-5 flex gap-2" role="group" aria-label="Choose game mode">
          <ModeTab
            active={mode === 'classic'}
            onClick={() => onChangeMode('classic')}
            title="Classic"
            subtitle="Endless survival, your personal best"
          />
          <ModeTab
            active={mode === 'daily'}
            onClick={() => onChangeMode('daily')}
            title="Daily"
            subtitle={formatDailyDate(dateKey)}
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
          <span className="text-slate-400">
            {mode === 'daily' ? "Today's best" : 'Personal best'}
          </span>
          <span className="font-display text-sm font-semibold text-white tabular-nums">
            {formatScore(mode === 'daily' ? dailyBest : best)}
          </span>
        </div>

        {mode === 'daily' && (
          <p className="mt-2 text-[0.68rem] leading-relaxed text-slate-400">
            Same seed for everyone today, slightly faster hazards. Scores are stored on this device.
          </p>
        )}

        <Button size="lg" className="mt-5 w-full" onClick={onStart} autoFocus>
          Play now
        </Button>

        <ul className="mt-5 space-y-2.5">
          {TUTORIAL.map((item) => (
            <li key={item.title} className="flex gap-2.5 text-left">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-magenta-400" />
              <span className="text-[0.72rem] leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-200">{item.title}. </span>
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
