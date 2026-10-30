import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GlowBoundEngine,
  dailyDateKey,
  dailySeed,
  pointSegmentDistance,
  type Obstacle,
} from '../lib/game/engine.ts';

const STEP = 1 / 60;

function makeEngine(options: { seed?: number; mode?: 'classic' | 'daily' } = {}) {
  const engine = new GlowBoundEngine({ width: 900, height: 600, seed: options.seed ?? 42, mode: options.mode ?? 'classic' });
  engine.start();
  return engine;
}

function advance(engine: GlowBoundEngine, seconds: number) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) engine.update(STEP);
}

function droneAt(x: number, y: number): Obstacle {
  return {
    id: 9999,
    kind: 'drone',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 20,
    angle: 0,
    spin: 0,
    length: 40,
    thickness: 40,
    gapY: 0,
    gapHeight: 0,
  };
}

test('daily seeds are stable per date and unique per day', () => {
  const a = dailySeed(new Date('2026-10-29T00:00:00Z'));
  const b = dailySeed(new Date('2026-10-29T23:59:59Z'));
  const c = dailySeed(new Date('2026-10-30T00:00:00Z'));

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(dailyDateKey(new Date('2026-10-29T23:59:59Z')), '2026-10-29');
});

test('same seed produces an identical run', () => {
  const first = makeEngine({ seed: 1234 });
  const second = makeEngine({ seed: 1234 });

  advance(first, 12);
  advance(second, 12);

  assert.equal(first.obstacles.length, second.obstacles.length);
  assert.deepEqual(
    first.obstacles.map((o) => [o.kind, Math.round(o.x), Math.round(o.y)]),
    second.obstacles.map((o) => [o.kind, Math.round(o.x), Math.round(o.y)]),
  );
  assert.equal(first.score, second.score);
});

test('different seeds diverge', () => {
  const first = makeEngine({ seed: 1 });
  const second = makeEngine({ seed: 2 });
  advance(first, 10);
  advance(second, 10);

  const a = JSON.stringify(first.obstacles);
  const b = JSON.stringify(second.obstacles);
  assert.notEqual(a, b);
});

test('survival awards score and keeps the run in bounds', () => {
  const engine = makeEngine();
  const startScore = engine.score;

  engine.setTarget(5000, 5000);
  advance(engine, 5);

  assert.ok(engine.score > startScore, 'score should increase over time');
  const p = engine.player;
  assert.ok(p.x >= p.radius - 0.001 && p.x <= engine.width - p.radius + 0.001);
  assert.ok(p.y >= p.radius - 0.001 && p.y <= engine.height - p.radius + 0.001);
});

test('collecting a gem awards points and starts a combo', () => {
  const engine = makeEngine();
  const before = engine.score;

  engine.gems.push({ id: 1, x: engine.player.x, y: engine.player.y, radius: 10, phase: 0 });
  engine.update(STEP);

  assert.equal(engine.gemsCollected, 1);
  assert.equal(engine.combo, 1);
  assert.equal(engine.multiplier, 1);
  assert.ok(engine.score >= before + 25, 'gem should be worth at least 25 points');
  assert.equal(engine.gems.length, 0);
});

test('multiplier rises every four gems and caps at 8x', () => {
  const engine = makeEngine();
  const collect = () => {
    engine.gems.push({ id: 1, x: engine.player.x, y: engine.player.y, radius: 10, phase: 0 });
    engine.update(STEP);
  };

  collect();
  collect();
  collect();
  assert.equal(engine.multiplier, 1);
  collect();
  assert.equal(engine.combo, 4);
  assert.equal(engine.multiplier, 2);

  for (let i = 0; i < 40; i += 1) collect();
  assert.equal(engine.multiplier, 8);
});

test('combo window expires and resets the multiplier', () => {
  const engine = makeEngine();
  for (let i = 0; i < 4; i += 1) {
    engine.gems.push({ id: 1, x: engine.player.x, y: engine.player.y, radius: 10, phase: 0 });
    engine.update(STEP);
  }
  assert.equal(engine.multiplier, 2);

  advance(engine, 3.6);
  assert.equal(engine.combo, 0);
  assert.equal(engine.multiplier, 1);
});

test('hitting a drone costs a heart, adds invulnerability and breaks the combo', () => {
  const engine = makeEngine();
  engine.gems.push({ id: 1, x: engine.player.x, y: engine.player.y, radius: 10, phase: 0 });
  engine.update(STEP);
  assert.equal(engine.combo, 1);

  engine.obstacles.push(droneAt(engine.player.x, engine.player.y));
  engine.update(STEP);

  assert.equal(engine.hp, 2);
  assert.ok(engine.invulnerable > 0);
  assert.equal(engine.combo, 0);
  assert.equal(engine.multiplier, 1);
});

test('a third hit ends the run', () => {
  const engine = makeEngine();

  for (let hit = 0; hit < 3; hit += 1) {
    engine.invulnerable = 0;
    engine.obstacles.push(droneAt(engine.player.x, engine.player.y));
    engine.update(STEP);
  }

  assert.equal(engine.hp, 0);
  assert.equal(engine.phase, 'over');
});

test('paused runs do not advance', () => {
  const engine = makeEngine();
  advance(engine, 1);
  const score = engine.score;
  const elapsed = engine.elapsed;

  engine.pause();
  advance(engine, 2);

  assert.equal(engine.score, score);
  assert.equal(engine.elapsed, elapsed);

  engine.resume();
  advance(engine, 1);
  assert.ok(engine.elapsed > elapsed);
});

test('laser gates only collide outside the gap', () => {
  const engine = makeEngine();
  const gate: Obstacle = {
    id: 42,
    kind: 'gate',
    x: engine.player.x,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    angle: 0,
    spin: 0,
    length: engine.height,
    thickness: 16,
    gapY: engine.player.y - 40,
    gapHeight: 120,
  };

  assert.equal(engine.hitsObstacle(gate), false, 'player inside the gap is safe');
  assert.equal(engine.hitsObstacle({ ...gate, gapY: 0, gapHeight: 60 }), true, 'player outside the gap is hit');
  assert.equal(
    engine.hitsObstacle({ ...gate, x: engine.player.x + 400, gapY: 0, gapHeight: 60 }),
    false,
    'a gate far away cannot hit',
  );
});

test('shard collision follows the segment, not a bounding circle', () => {
  const engine = makeEngine();
  const shard: Obstacle = {
    id: 7,
    kind: 'shard',
    x: engine.player.x,
    y: engine.player.y - 200,
    vx: 0,
    vy: 0,
    radius: 60,
    angle: 0,
    spin: 0,
    length: 120,
    thickness: 10,
    gapY: 0,
    gapHeight: 0,
  };

  assert.equal(engine.hitsObstacle(shard), false, 'shard above the player should not collide');
  assert.equal(engine.hitsObstacle({ ...shard, y: engine.player.y }), true);
});

test('point-to-segment distance is correct', () => {
  assert.equal(pointSegmentDistance(0, 0, -10, 0, 10, 0), 0);
  assert.equal(pointSegmentDistance(0, 5, -10, 0, 10, 0), 5);
  assert.equal(pointSegmentDistance(0, 5, 10, 0, 20, 0), Math.hypot(10, 5));
});

test('restart resets score, health and hazards', () => {
  const engine = makeEngine();
  engine.obstacles.push(droneAt(engine.player.x + 300, engine.player.y + 300));
  advance(engine, 3);
  assert.ok(engine.obstacles.length > 0);

  engine.start();
  assert.equal(engine.score, 0);
  assert.equal(engine.hp, 3);
  assert.equal(engine.obstacles.length, 0);
  assert.equal(engine.gems.length, 0);
  assert.equal(engine.level, 1);
  assert.equal(engine.phase, 'playing');
});

test('difficulty level rises with survival time', () => {
  const engine = makeEngine();
  advance(engine, 1);
  assert.equal(engine.level, 1);
  advance(engine, 19);
  assert.ok(engine.level >= 2);
});

test('new hazards always enter from outside the playfield', () => {
  const engine = makeEngine();
  let checked = 0;

  for (let step = 0; step < 600; step += 1) {
    const known = new Set(engine.obstacles.map((obstacle) => obstacle.id));
    engine.update(STEP);
    for (const obstacle of engine.obstacles) {
      if (known.has(obstacle.id)) continue;
      const fromEdge =
        obstacle.x >= engine.width || obstacle.x <= 0 || obstacle.y <= 0 || obstacle.y >= engine.height;
      assert.ok(
        fromEdge,
        `${obstacle.kind} spawned inside the arena at ${obstacle.x},${obstacle.y}`,
      );
      checked += 1;
    }
  }

  assert.ok(checked > 0, 'expected hazards to spawn during 10 seconds');
});

test('gems spawn away from a stationary player', () => {
  const engine = makeEngine();
  advance(engine, 12);

  const p = engine.player;
  for (const gem of engine.gems) {
    assert.ok(
      Math.hypot(gem.x - p.x, gem.y - p.y) > 60,
      `gem spawned ${Math.round(Math.hypot(gem.x - p.x, gem.y - p.y))}px from the player`,
    );
  }
});

test('laser gates always leave a gap wide enough to pass', () => {
  const engine = makeEngine();
  const observed: Obstacle[] = [];
  const seen = new Set<number>();
  // Keep the player alive without clearing the arena so gate spawning is exercised.
  const steps = Math.round(70 / STEP);
  for (let i = 0; i < steps; i += 1) {
    engine.invulnerable = 1;
    engine.update(STEP);
    for (const obstacle of engine.obstacles) {
      if (seen.has(obstacle.id)) continue;
      seen.add(obstacle.id);
      observed.push({ ...obstacle });
    }
  }

  const gates = observed.filter((obstacle) => obstacle.kind === 'gate');
  assert.ok(gates.length > 0, 'expected laser gates after level 3');
  for (const gate of gates) {
    assert.ok(gate.gapHeight >= 100, `gap too small: ${gate.gapHeight}`);
    assert.ok(gate.gapY >= 0, 'gap starts above the arena');
    assert.ok(gate.gapY + gate.gapHeight <= engine.height, 'gap extends past the arena');
  }
});

test('resizing keeps the player inside the new bounds', () => {
  const engine = makeEngine();
  engine.player.x = 880;
  engine.player.y = 580;

  engine.resize(320, 200);

  assert.ok(engine.player.x <= 320 - engine.player.radius);
  assert.ok(engine.player.y <= 200 - engine.player.radius);
  assert.ok(engine.player.x >= engine.player.radius);
  assert.ok(engine.player.y >= engine.player.radius);
});

test('restarting mid-run clears combo, multiplier and elapsed time', () => {
  const engine = makeEngine();
  for (let i = 0; i < 5; i += 1) {
    engine.gems.push({ id: 1, x: engine.player.x, y: engine.player.y, radius: 10, phase: 0 });
    engine.update(STEP);
  }
  advance(engine, 4);

  engine.start();

  assert.equal(engine.score, 0);
  assert.equal(engine.combo, 0);
  assert.equal(engine.bestCombo, 0);
  assert.equal(engine.multiplier, 1);
  assert.equal(engine.gemsCollected, 0);
  assert.equal(engine.elapsed, 0);
  assert.equal(engine.invulnerable, 0);
});

test('scores stay finite and non-negative over a long run', () => {
  const engine = makeEngine();
  engine.setTarget(0, 0);
  advance(engine, 30);

  assert.ok(Number.isFinite(engine.score));
  assert.ok(engine.score >= 0);
  assert.ok(Number.isInteger(engine.getSnapshot().score));
});
