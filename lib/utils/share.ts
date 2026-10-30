import type { GameMode } from '@/lib/game/engine';
import { dailyDateKey } from '@/lib/game/engine';

export type ShareStatus = 'shared' | 'copied' | 'dismissed' | 'unsupported' | 'error';

export interface ShareScoreInput {
  score: number;
  mode: GameMode;
  level: number;
  gems: number;
}

export function buildShareText({ score, mode, level, gems }: ShareScoreInput): string {
  const label = mode === 'daily' ? `GlowBound Daily Challenge (${dailyDateKey()})` : 'GlowBound';
  const formatted = new Intl.NumberFormat('en-US').format(score);
  return `I scored ${formatted} points in ${label} — reached level ${level} and collected ${gems} energy gems. Can you beat it?`;
}

/**
 * Uses the native share sheet when available, otherwise copies the result to the
 * clipboard. Returns a status so the UI can show the right confirmation.
 */
export async function shareScore(input: ShareScoreInput): Promise<ShareStatus> {
  const text = buildShareText(input);
  const url = typeof window !== 'undefined' ? window.location.origin : undefined;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'GlowBound', text, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed';
      // Fall through to clipboard on any other share failure.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
      return 'copied';
    } catch {
      return 'error';
    }
  }

  return 'unsupported';
}
