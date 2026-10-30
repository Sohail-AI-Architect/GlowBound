import assert from 'node:assert/strict';
import test from 'node:test';

// Minimal localStorage stub so the browser-only module can run in Node.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
};

const {
  bestForMode,
  defaultProgress,
  getProgressSnapshot,
  loadProgress,
  recordRun,
  saveProgress,
  setSoundPreference,
  subscribeProgress,
} = await import('../lib/game/storage.ts');

const KEY = 'glowbound.progress.v1';

test.beforeEach(() => store.clear());

test('missing or corrupt data falls back to defaults', () => {
  assert.deepEqual(loadProgress(), defaultProgress());

  store.set(KEY, '{"bestClassic":"not-a-number","bestDaily":{"2026-10-29":-5}}');
  const progress = loadProgress();
  assert.equal(progress.bestClassic, 0);
  assert.equal(progress.bestDaily['2026-10-29'], undefined);
  assert.equal(progress.soundEnabled, true);

  store.set(KEY, '<<<not json>>>');
  assert.deepEqual(loadProgress(), defaultProgress());
});

test('classic best is only replaced by a higher score', () => {
  const first = recordRun('classic', 500, 6, '2026-10-29');
  assert.equal(first.isNewBest, true);
  assert.equal(first.best, 500);

  const lower = recordRun('classic', 200, 3, '2026-10-29');
  assert.equal(lower.isNewBest, false);
  assert.equal(lower.best, 500);

  const higher = recordRun('classic', 900, 9, '2026-10-29');
  assert.equal(higher.isNewBest, true);
  assert.equal(higher.best, 900);
  assert.equal(higher.progress.bestCombo, 9);
  assert.equal(higher.progress.gamesPlayed, 3);
});

test('daily bests are tracked per date', () => {
  recordRun('daily', 300, 4, '2026-10-29');
  const sameDay = recordRun('daily', 250, 4, '2026-10-29');
  assert.equal(sameDay.best, 300);
  assert.equal(sameDay.isNewBest, false);

  const nextDay = recordRun('daily', 100, 2, '2026-10-30');
  assert.equal(nextDay.best, 100);
  assert.equal(nextDay.isNewBest, true);

  const progress = loadProgress();
  assert.equal(progress.bestDaily['2026-10-29'], 300);
  assert.equal(progress.bestDaily['2026-10-30'], 100);
  assert.equal(bestForMode(progress, 'daily', '2026-10-29'), 300);
  assert.equal(bestForMode(progress, 'classic'), 0);
});

test('sound preference persists', () => {
  setSoundPreference(false);
  assert.equal(loadProgress().soundEnabled, false);
  setSoundPreference(true);
  assert.equal(loadProgress().soundEnabled, true);
});

test('saved progress round-trips', () => {
  const progress = defaultProgress();
  progress.bestClassic = 4242;
  progress.bestDaily['2026-01-01'] = 77;
  saveProgress(progress);
  assert.deepEqual(loadProgress(), progress);
});

test('invalid numbers are never persisted', () => {
  store.set(
    KEY,
    '{"bestClassic":1e999,"bestCombo":-1,"gamesPlayed":1e999,"bestDaily":{"2026-10-29":1e999}}',
  );
  const progress = loadProgress();
  assert.equal(progress.bestClassic, 0);
  assert.equal(progress.bestCombo, 0);
  assert.equal(progress.gamesPlayed, 0);
  assert.equal(progress.bestDaily['2026-10-29'], undefined);

  const run = recordRun('classic', Number.NaN, Number.NaN, '2026-10-29');
  assert.equal(run.isNewBest, false);
  assert.equal(run.best, 0);
  assert.equal(run.progress.bestCombo, 0);
  assert.deepEqual(loadProgress(), run.progress);
});

test('storage failures never throw', () => {
  const scope = globalThis as unknown as { window: { localStorage: unknown } };
  const original = scope.window.localStorage;
  scope.window.localStorage = {
    getItem: () => {
      throw new Error('storage disabled');
    },
    setItem: () => {
      throw new Error('storage disabled');
    },
    removeItem: () => {
      throw new Error('storage disabled');
    },
  };

  try {
    assert.deepEqual(loadProgress(), defaultProgress());
    assert.doesNotThrow(() => saveProgress(defaultProgress()));
    assert.doesNotThrow(() => recordRun('classic', 120, 3, '2026-10-29'));
    assert.doesNotThrow(() => setSoundPreference(false));
  } finally {
    scope.window.localStorage = original;
  }
});

test('progress subscribers are notified once per write', () => {
  let calls = 0;
  const unsubscribe = subscribeProgress(() => {
    calls += 1;
  });

  saveProgress(defaultProgress());
  unsubscribe();
  saveProgress(defaultProgress());

  assert.equal(calls, 1);
});

test('the client snapshot is rebuilt after a write', () => {
  const first = defaultProgress();
  first.bestClassic = 321;
  saveProgress(first);
  assert.equal(getProgressSnapshot().bestClassic, 321);

  const second = defaultProgress();
  second.bestClassic = 99;
  saveProgress(second);
  assert.equal(getProgressSnapshot().bestClassic, 99);
});
