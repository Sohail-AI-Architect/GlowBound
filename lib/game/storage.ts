/**
 * Local personal-best storage.
 *
 * Everything lives in the player's browser only: there is no backend, so no
 * global leaderboard is implied anywhere in the UI. Storage is wrapped in
 * try/catch because Safari private mode and disabled-cookie browsers throw.
 */
import type { GameMode } from './engine';

const STORAGE_KEY = 'glowbound.progress.v1';

/** UTC date key, matching the engine's daily seed key (YYYY-MM-DD). */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface Progress {
  bestClassic: number;
  /** Daily bests keyed by UTC date, e.g. { "2026-10-29": 1420 }. */
  bestDaily: Record<string, number>;
  bestCombo: number;
  soundEnabled: boolean;
  gamesPlayed: number;
}

export function defaultProgress(): Progress {
  return {
    bestClassic: 0,
    bestDaily: {},
    bestCombo: 0,
    soundEnabled: true,
    gamesPlayed: 0,
  };
}

/** Non-negative finite integer, used for every numeric field read or written. */
function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function sanitize(raw: unknown): Progress {
  const base = defaultProgress();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Partial<Progress>;
  const bestDaily: Record<string, number> = {};
  if (value.bestDaily && typeof value.bestDaily === 'object') {
    for (const [key, score] of Object.entries(value.bestDaily)) {
      if (typeof score === 'number' && Number.isFinite(score) && score >= 0) {
        bestDaily[key] = Math.floor(score);
      }
    }
  }
  return {
    bestClassic: safeCount(value.bestClassic),
    bestDaily,
    bestCombo: safeCount(value.bestCombo),
    soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : true,
    gamesPlayed: safeCount(value.gamesPlayed),
  };
}

export function loadProgress(): Progress {
  if (typeof window === 'undefined') return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode / quota). Personal bests simply do not persist.
  }
  notifyProgressChange();
}

/* -------------------------------------------------------------------------- *
 * External-store adapter for React's useSyncExternalStore.
 *
 * Reading localStorage during render would break server rendering and hydration,
 * so components subscribe here instead and receive the defaults on the server.
 * -------------------------------------------------------------------------- */

const SERVER_PROGRESS: Progress = defaultProgress();
let cachedProgress: Progress | null = null;
const progressListeners = new Set<() => void>();

function notifyProgressChange(): void {
  cachedProgress = null;
  for (const listener of progressListeners) listener();
}

export function subscribeProgress(listener: () => void): () => void {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

/** Stable client snapshot; cached so useSyncExternalStore does not loop. */
export function getProgressSnapshot(): Progress {
  if (!cachedProgress) cachedProgress = loadProgress();
  return cachedProgress;
}

/** Snapshot used during server rendering and hydration. */
export function getProgressServerSnapshot(): Progress {
  return SERVER_PROGRESS;
}

export function bestForMode(progress: Progress, mode: GameMode, dateKey = todayKey()): number {
  return mode === 'daily' ? progress.bestDaily[dateKey] ?? 0 : progress.bestClassic;
}

export interface RunResult {
  progress: Progress;
  isNewBest: boolean;
  best: number;
}

/** Persist a finished run and report whether it beat the stored best. */
export function recordRun(
  mode: GameMode,
  score: number,
  combo: number,
  dateKey = todayKey(),
): RunResult {
  const progress = loadProgress();
  const safeScore = safeCount(score);
  let isNewBest = false;

  if (mode === 'daily') {
    const previous = progress.bestDaily[dateKey] ?? 0;
    if (safeScore > previous) {
      progress.bestDaily[dateKey] = safeScore;
      isNewBest = true;
    }
  } else if (safeScore > progress.bestClassic) {
    progress.bestClassic = safeScore;
    isNewBest = true;
  }

  progress.bestCombo = Math.max(progress.bestCombo, safeCount(combo));
  progress.gamesPlayed += 1;
  saveProgress(progress);

  return {
    progress,
    isNewBest,
    best: bestForMode(progress, mode, dateKey),
  };
}

export function setSoundPreference(enabled: boolean): Progress {
  const progress = loadProgress();
  progress.soundEnabled = enabled;
  saveProgress(progress);
  return progress;
}
