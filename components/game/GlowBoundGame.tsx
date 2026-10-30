'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { GameControls } from './GameControls';
import { StartScreen } from './StartScreen';
import { PauseScreen } from './PauseScreen';
import { GameOver, type RunSummary } from './GameOver';
import { SoundEngine } from '@/lib/game/audio';
import {
  GlowBoundEngine,
  PLAYER_MAX_HP,
  dailyDateKey,
  dailySeed,
  type GameMode,
  type GameSnapshot,
} from '@/lib/game/engine';
import {
  bestForMode,
  getProgressServerSnapshot,
  getProgressSnapshot,
  recordRun,
  setSoundPreference,
  subscribeProgress,
} from '@/lib/game/storage';
import { shareScore, type ShareStatus } from '@/lib/utils/share';
import { formatDailyDate } from '@/lib/utils/format';

const EMPTY_SNAPSHOT: GameSnapshot = {
  phase: 'menu',
  mode: 'classic',
  score: 0,
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  combo: 0,
  bestCombo: 0,
  multiplier: 1,
  level: 1,
  gems: 0,
  elapsed: 0,
  invulnerable: 0,
};

function createEngine(mode: GameMode): GlowBoundEngine {
  const seed =
    mode === 'daily'
      ? dailySeed()
      : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  return new GlowBoundEngine({ mode, seed, width: 900, height: 600 });
}

/* Browser-only values exposed through useSyncExternalStore so the server render
 * and the first client render always match. */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionOnServer(): boolean {
  return false;
}

/** UTC date key: empty during SSR, the current day in the browser. */
function subscribeDateKey(): () => void {
  return () => {};
}

function getDateKey(): string {
  return dailyDateKey();
}

function getDateKeyOnServer(): string {
  return '';
}

export function GlowBoundGame() {
  const [engine, setEngine] = useState<GlowBoundEngine>(() => createEngine('classic'));
  const [snapshot, setSnapshot] = useState<GameSnapshot>(EMPTY_SNAPSHOT);
  const [result, setResult] = useState<RunSummary | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);

  const progress = useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot,
  );
  const soundEnabled = progress.soundEnabled;
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );
  const dateKey = useSyncExternalStore(subscribeDateKey, getDateKey, getDateKeyOnServer);

  const soundRef = useRef<SoundEngine | null>(null);
  const mode = engine.mode;

  // Client-only setup: the lazily-created AudioContext wrapper.
  useEffect(() => {
    const sound = new SoundEngine();
    soundRef.current = sound;
    sound.setEnabled(getProgressSnapshot().soundEnabled);
    return () => {
      sound.dispose();
      soundRef.current = null;
    };
  }, []);

  // Keep the audio engine in sync with the persisted preference.
  useEffect(() => {
    soundRef.current?.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Engine events -> sound + persisted results.
  useEffect(() => {
    engine.setEventListener((type) => {
      if (type === 'gameover') {
        const finalSnapshot = engine.getSnapshot();
        const todayKey = dailyDateKey();
        const run = recordRun(engine.mode, finalSnapshot.score, finalSnapshot.bestCombo, todayKey);
        setResult({
          score: finalSnapshot.score,
          level: finalSnapshot.level,
          gems: finalSnapshot.gems,
          bestCombo: finalSnapshot.bestCombo,
          elapsed: finalSnapshot.elapsed,
          mode: engine.mode,
          isNewBest: run.isNewBest,
          best: run.best,
          dateKey: todayKey,
        });
        setShareStatus(null);
        setSnapshot(finalSnapshot);
        soundRef.current?.play('gameover');
        return;
      }

      soundRef.current?.play(type);
      setSnapshot(engine.getSnapshot());
    });

    return () => engine.setEventListener(null);
  }, [engine]);

  const startRun = useCallback(() => {
    soundRef.current?.unlock();
    soundRef.current?.play('start');
    engine.start();
    setResult(null);
    setShareStatus(null);
    setSnapshot(engine.getSnapshot());
  }, [engine]);

  const togglePause = useCallback(() => {
    engine.togglePause();
    setSnapshot(engine.getSnapshot());
  }, [engine]);

  const quitToMenu = useCallback(() => {
    engine.reset();
    setResult(null);
    setShareStatus(null);
    setSnapshot(engine.getSnapshot());
  }, [engine]);

  const changeMode = useCallback(
    (nextMode: GameMode) => {
      if (nextMode === engine.mode) return;
      const next = createEngine(nextMode);
      setEngine(next);
      setSnapshot(next.getSnapshot());
      setResult(null);
      setShareStatus(null);
    },
    [engine],
  );

  const toggleSound = useCallback(() => {
    const next = !getProgressSnapshot().soundEnabled;
    soundRef.current?.unlock();
    soundRef.current?.setEnabled(next);
    setSoundPreference(next);
  }, []);

  const handleShare = useCallback(async () => {
    if (!result) return;
    const status = await shareScore({
      score: result.score,
      mode: result.mode,
      level: result.level,
      gems: result.gems,
    });
    setShareStatus(status);
  }, [result]);

  // Auto-pause when the tab is hidden so a run is never lost in the background.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && engine.phase === 'playing') {
        engine.pause();
        setSnapshot(engine.getSnapshot());
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [engine]);

  // Global shortcuts: start, pause and mute.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const onControl =
        !!target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const phase = snapshot.phase;

      if (event.key === ' ' || event.key === 'Enter') {
        if (onControl) return; // let the focused control handle activation
        if (phase === 'menu' || phase === 'over' || phase === 'paused') {
          event.preventDefault();
          if (phase === 'paused') togglePause();
          else startRun();
        }
        return;
      }

      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (phase === 'playing' || phase === 'paused') {
          event.preventDefault();
          togglePause();
        }
        return;
      }

      if (event.key === 'm' || event.key === 'M') {
        if (!onControl) toggleSound();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [snapshot.phase, startRun, togglePause, toggleSound]);

  const best = useMemo(
    () => bestForMode(progress, mode, dateKey || dailyDateKey()),
    [progress, mode, dateKey],
  );
  const dailyBest = dateKey ? progress.bestDaily[dateKey] ?? 0 : 0;

  const phase = snapshot.phase;
  const announcement =
    phase === 'over' && result
      ? `Run over. Final score ${result.score}. Personal best ${result.best}.`
      : phase === 'paused'
        ? 'Game paused.'
        : phase === 'playing'
          ? 'Game started.'
          : 'GlowBound menu. Press Play now to begin.';

  return (
    <section aria-labelledby="arena-heading" className="w-full">
      <h2 id="arena-heading" className="sr-only">
        GlowBound playable arena
      </h2>

      <div className="relative mx-auto w-full max-w-4xl">
        <div className="relative h-[clamp(420px,68vh,620px)] w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-void-950 shadow-[0_0_90px_-30px_rgba(139,92,246,0.9)] ring-1 ring-inset ring-white/5">
          <GameCanvas engine={engine} onSnapshot={setSnapshot} reducedMotion={reducedMotion} />

          {(phase === 'playing' || phase === 'paused') && (
            <GameHUD
              snapshot={snapshot}
              best={best}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onTogglePause={togglePause}
            />
          )}

          {phase === 'playing' && <GameControls />}

          {phase === 'menu' && (
            <StartScreen
              mode={mode}
              onChangeMode={changeMode}
              best={progress.bestClassic}
              dailyBest={dailyBest}
              dateKey={dateKey}
              onStart={startRun}
            />
          )}

          {phase === 'paused' && (
            <PauseScreen
              score={snapshot.score}
              onResume={togglePause}
              onRestart={startRun}
              onQuit={quitToMenu}
            />
          )}

          {phase === 'over' && result && (
            <GameOver
              summary={result}
              shareStatus={shareStatus}
              onShare={handleShare}
              onRestart={startRun}
              onMenu={quitToMenu}
            />
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {dateKey
          ? `Daily challenge for ${formatDailyDate(dateKey)} is seeded identically for everyone.`
          : 'Personal bests are saved in your browser only.'}
      </p>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
