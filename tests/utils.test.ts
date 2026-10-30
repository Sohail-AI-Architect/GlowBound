import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDailyDate, formatDuration, formatScore } from '../lib/utils/format.ts';

test('scores are formatted with grouping and never negative', () => {
  assert.equal(formatScore(0), '0');
  assert.equal(formatScore(12345.9), '12,345');
  assert.equal(formatScore(-50), '0');
});

test('durations use mm:ss', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(9.9), '0:09');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(-3), '0:00');
});

test('daily date keys are rendered as UTC dates', () => {
  assert.equal(formatDailyDate('2026-10-29'), '29 October 2026');
  assert.equal(formatDailyDate('not-a-date'), 'not-a-date');
});
