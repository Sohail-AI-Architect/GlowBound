/**
 * GlowBound game engine.
 *
 * Intentionally self-contained and free of browser APIs so it can be unit tested
 * in Node and rendered by any renderer. All timing is driven by the caller
 * (`update(dtSeconds)`), and all randomness comes from an injected seed, so a
 * given seed always produces the same run. That determinism is what makes the
 * daily challenge identical for every player.
 *
 * Coordinate space: CSS pixels of the playfield. `resize()` keeps an active run
 * valid when the viewport changes (orientation change, window resize).
 */

export const PLAYER_MAX_HP = 3;
export const COMBO_WINDOW_SECONDS = 3.2;
export const GEM_VALUE = 25;
export const SURVIVAL_POINTS_PER_SECOND = 9;
export const MAX_MULTIPLIER = 8;
export const LEVEL_SECONDS = 18;
export const MAX_LEVEL = 20;

export type GameMode = 'classic' | 'daily';
export type GamePhase = 'menu' | 'playing' | 'paused' | 'over';
export type ObstacleKind = 'shard' | 'drone' | 'gate';
export type GameEventType = 'gem' | 'hit' | 'levelup' | 'gameover';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Collision radius for drones, half thickness reference for shards. */
  radius: number;
  angle: number;
  spin: number;
  length: number;
  thickness: number;
  /** Vertical gap position (top edge) and height, used by laser gates. */
  gapY: number;
  gapHeight: number;
}

export interface Gem {
  id: number;
  x: number;
  y: number;
  radius: number;
  /** Purely visual bobbing phase. */
  phase: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface GameSnapshot {
  phase: GamePhase;
  mode: GameMode;
  score: number;
  hp: number;
  maxHp: number;
  combo: number;
  bestCombo: number;
  multiplier: number;
  level: number;
  gems: number;
  elapsed: number;
  invulnerable: number;
}

export interface EngineOptions {
  width?: number;
  height?: number;
  mode?: GameMode;
  seed?: number;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Deterministic 32-bit PRNG (mulberry32). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash, used to turn a date string into a stable seed. */
export function seedFromString(value: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** UTC date key, e.g. "2026-10-29". */
export function dailyDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailySeed(date: Date = new Date()): number {
  return seedFromString(`glowbound:${dailyDateKey(date)}`);
}

/** Shortest distance from a point to a line segment. */
export function pointSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSquared, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export class GlowBoundEngine {
  width: number;
  height: number;
  mode: GameMode;
  seed: number;
  phase: GamePhase = 'menu';
  score = 0;
  hp = PLAYER_MAX_HP;
  combo = 0;
  bestCombo = 0;
  multiplier = 1;
  gemsCollected = 0;
  level = 1;
  elapsed = 0;
  invulnerable = 0;
  /** Render-only feedback values, consumed by the canvas renderer. */
  shake = 0;
  flash = 0;
  player: Player;
  obstacles: Obstacle[] = [];
  gems: Gem[] = [];
  onEvent: ((type: GameEventType, snapshot: GameSnapshot) => void) | null = null;

  private rng: () => number;
  private idCounter = 1;
  private spawnTimer = 0;
  private gemTimer = 0;
  private comboWindow = 0;
  private input: Vec2 = { x: 0, y: 0 };
  private target: Vec2 | null = null;

  constructor(options: EngineOptions = {}) {
    this.width = options.width ?? 900;
    this.height = options.height ?? 600;
    this.mode = options.mode ?? 'classic';
    this.seed = options.seed ?? 1;
    this.rng = createRng(this.seed);
    this.player = this.createPlayer();
  }

  private createPlayer(): Player {
    return {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      radius: clamp(Math.min(this.width, this.height) * 0.032, 10, 20),
    };
  }

  get isDaily(): boolean {
    return this.mode === 'daily';
  }

  /**
   * Registers (or clears, with null) the game-event listener. Kept as a method
   * so the React wrapper never has to mutate engine state directly.
   */
  setEventListener(listener: ((type: GameEventType, snapshot: GameSnapshot) => void) | null): void {
    this.onEvent = listener;
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.player.radius = clamp(Math.min(this.width, this.height) * 0.032, 10, 20);
    this.player.x = clamp(this.player.x, this.player.radius, this.width - this.player.radius);
    this.player.y = clamp(this.player.y, this.player.radius, this.height - this.player.radius);
  }

  reset(): void {
    this.rng = createRng(this.seed);
    this.phase = 'menu';
    this.score = 0;
    this.hp = PLAYER_MAX_HP;
    this.combo = 0;
    this.bestCombo = 0;
    this.multiplier = 1;
    this.gemsCollected = 0;
    this.level = 1;
    this.elapsed = 0;
    this.invulnerable = 0;
    this.shake = 0;
    this.flash = 0;
    this.obstacles = [];
    this.gems = [];
    this.idCounter = 1;
    this.spawnTimer = 0.9;
    this.gemTimer = 0.6;
    this.comboWindow = 0;
    this.input = { x: 0, y: 0 };
    this.target = null;
    this.player = this.createPlayer();
  }

  start(): void {
    this.reset();
    this.phase = 'playing';
  }

  pause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
  }

  resume(): void {
    if (this.phase === 'paused') this.phase = 'playing';
  }

  togglePause(): void {
    if (this.phase === 'playing') this.pause();
    else if (this.phase === 'paused') this.resume();
  }

  /** Keyboard / on-screen D-pad input. Magnitude is normalised. */
  setInput(x: number, y: number): void {
    const magnitude = Math.hypot(x, y);
    if (magnitude === 0) {
      this.input = { x: 0, y: 0 };
      return;
    }
    this.input = { x: x / magnitude, y: y / magnitude };
    this.target = null;
  }

  /** Pointer steering target in playfield pixels. */
  setTarget(x: number, y: number): void {
    this.target = {
      x: clamp(x, 0, this.width),
      y: clamp(y, 0, this.height),
    };
    this.input = { x: 0, y: 0 };
  }

  clearTarget(): void {
    this.target = null;
  }

  update(dtSeconds: number): void {
    if (this.phase !== 'playing') return;
    const dt = clamp(dtSeconds, 0, 0.05);

    this.elapsed += dt;
    this.score += SURVIVAL_POINTS_PER_SECOND * this.multiplier * dt;

    const nextLevel = clamp(1 + Math.floor(this.elapsed / LEVEL_SECONDS), 1, MAX_LEVEL);
    if (nextLevel !== this.level) {
      this.level = nextLevel;
      this.emit('levelup');
    }

    this.updatePlayer(dt);
    this.updateSpawning(dt);
    this.updateObstacles(dt);
    this.updateGems(dt);
    this.updateCombo(dt);
    this.resolveCollectibles();
    this.resolveHazards();

    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.shake = Math.max(0, this.shake - dt * 2.4);
    this.flash = Math.max(0, this.flash - dt * 3.2);
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const maxSpeed = 640;

    if (this.target) {
      const dx = this.target.x - p.x;
      const dy = this.target.y - p.y;
      const distance = Math.hypot(dx, dy);
      const desiredSpeed = distance > 2 ? Math.min(maxSpeed, distance * 9) : 0;
      const desiredVx = distance > 0.001 ? (dx / distance) * desiredSpeed : 0;
      const desiredVy = distance > 0.001 ? (dy / distance) * desiredSpeed : 0;
      const blend = 1 - Math.exp(-14 * dt);
      p.vx += (desiredVx - p.vx) * blend;
      p.vy += (desiredVy - p.vy) * blend;
    } else {
      const steering = this.input.x !== 0 || this.input.y !== 0;
      if (steering) {
        p.vx += this.input.x * 2600 * dt;
        p.vy += this.input.y * 2600 * dt;
      }
      const drag = Math.exp((steering ? -4.2 : -7) * dt);
      p.vx *= drag;
      p.vy *= drag;
    }

    const speed = Math.hypot(p.vx, p.vy);
    if (speed > maxSpeed) {
      p.vx = (p.vx / speed) * maxSpeed;
      p.vy = (p.vy / speed) * maxSpeed;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < p.radius) {
      p.x = p.radius;
      p.vx = Math.abs(p.vx) * 0.2;
    } else if (p.x > this.width - p.radius) {
      p.x = this.width - p.radius;
      p.vx = -Math.abs(p.vx) * 0.2;
    }
    if (p.y < p.radius) {
      p.y = p.radius;
      p.vy = Math.abs(p.vy) * 0.2;
    } else if (p.y > this.height - p.radius) {
      p.y = this.height - p.radius;
      p.vy = -Math.abs(p.vy) * 0.2;
    }
  }

  private nextSpawnDelay(): number {
    const base = Math.max(0.42, 1.28 - (this.level - 1) * 0.075);
    const jitter = 0.8 + this.rng() * 0.5;
    return base * jitter * (this.isDaily ? 0.9 : 1);
  }

  private nextGemDelay(): number {
    return (1.05 + this.rng() * 0.85) * (this.isDaily ? 0.85 : 1);
  }

  private obstacleSpeed(): number {
    const base = 155 + (this.level - 1) * 20;
    return base * (this.isDaily ? 1.12 : 1) * (0.85 + this.rng() * 0.35);
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = this.nextSpawnDelay();
    }

    this.gemTimer -= dt;
    if (this.gemTimer <= 0 && this.gems.length < 6) {
      this.spawnGem();
      this.gemTimer = this.nextGemDelay();
    }
  }

  private spawnObstacle(): void {
    const roll = this.rng();
    if (this.level >= 3 && roll > 0.84) {
      this.spawnGate();
      return;
    }
    if (roll > 0.52) this.spawnDrone();
    else this.spawnShard();
  }

  private spawnShard(): void {
    const fromTop = this.rng() < 0.24;
    const speed = this.obstacleSpeed();
    const length = 60 + this.rng() * 70;
    const thickness = 8 + this.rng() * 4;
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    if (fromTop) {
      x = 60 + this.rng() * Math.max(1, this.width - 120);
      y = -70;
      vx = -speed * 0.3;
      vy = speed;
    } else {
      x = this.width + 90;
      y = 50 + this.rng() * Math.max(1, this.height - 100);
      vx = -speed;
      vy = (this.rng() - 0.5) * 90;
    }

    this.obstacles.push({
      id: this.idCounter++,
      kind: 'shard',
      x,
      y,
      vx,
      vy,
      radius: length / 2,
      angle: fromTop ? Math.PI / 2 : (this.rng() - 0.5) * 1.2,
      spin: (this.rng() - 0.5) * 1.4,
      length,
      thickness,
      gapY: 0,
      gapHeight: 0,
    });
  }

  private spawnDrone(): void {
    const fromTop = this.rng() < 0.24;
    const speed = this.obstacleSpeed() * 0.86;
    const radius = 13 + this.rng() * 13;
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    if (fromTop) {
      x = 50 + this.rng() * Math.max(1, this.width - 100);
      y = -60;
      vx = -speed * 0.3;
      vy = speed;
    } else {
      x = this.width + 70;
      y = 50 + this.rng() * Math.max(1, this.height - 100);
      vx = -speed;
      vy = (this.rng() - 0.5) * 60;
    }

    this.obstacles.push({
      id: this.idCounter++,
      kind: 'drone',
      x,
      y,
      vx,
      vy,
      radius,
      angle: this.rng() * Math.PI * 2,
      spin: (this.rng() - 0.5) * 2.2,
      length: radius * 2,
      thickness: radius * 2,
      gapY: 0,
      gapHeight: 0,
    });
  }

  private spawnGate(): void {
    const gapHeight = clamp(this.height * 0.28, 116, 240);
    const maxGapY = Math.max(24, this.height - gapHeight - 24);
    const gapY = 24 + this.rng() * Math.max(1, maxGapY - 24);
    this.obstacles.push({
      id: this.idCounter++,
      kind: 'gate',
      x: this.width + 40,
      y: 0,
      vx: -(120 + this.level * 12) * (this.isDaily ? 1.08 : 1),
      vy: 0,
      radius: 0,
      angle: 0,
      spin: 0,
      length: this.height,
      thickness: 16,
      gapY,
      gapHeight,
    });
  }

  private spawnGem(): void {
    const margin = 44;
    let x = margin;
    let y = margin;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      x = margin + this.rng() * Math.max(1, this.width - margin * 2);
      y = margin + this.rng() * Math.max(1, this.height - margin * 2);
      if (Math.hypot(x - this.player.x, y - this.player.y) > 90) break;
    }
    this.gems.push({
      id: this.idCounter++,
      x,
      y,
      radius: clamp(Math.min(this.width, this.height) * 0.018, 8, 13),
      phase: this.rng() * Math.PI * 2,
    });
  }

  private updateObstacles(dt: number): void {
    const survivors: Obstacle[] = [];
    for (const obstacle of this.obstacles) {
      obstacle.x += obstacle.vx * dt;
      obstacle.y += obstacle.vy * dt;
      obstacle.angle += obstacle.spin * dt;
      const offscreen =
        obstacle.x < -220 ||
        obstacle.x > this.width + 260 ||
        obstacle.y < -260 ||
        obstacle.y > this.height + 260;
      if (!offscreen) survivors.push(obstacle);
    }
    this.obstacles = survivors;
  }

  private updateGems(dt: number): void {
    for (const gem of this.gems) gem.phase += dt * 2.4;
  }

  private updateCombo(dt: number): void {
    if (this.comboWindow <= 0) return;
    this.comboWindow -= dt;
    if (this.comboWindow <= 0) {
      this.comboWindow = 0;
      this.combo = 0;
      this.multiplier = 1;
    }
  }

  private resolveCollectibles(): void {
    const p = this.player;
    const remaining: Gem[] = [];
    for (const gem of this.gems) {
      const collected = Math.hypot(gem.x - p.x, gem.y - p.y) < p.radius + gem.radius + 2;
      if (!collected) {
        remaining.push(gem);
        continue;
      }
      this.gemsCollected += 1;
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.comboWindow = COMBO_WINDOW_SECONDS;
      this.multiplier = clamp(1 + Math.floor(this.combo / 4), 1, MAX_MULTIPLIER);
      this.score += GEM_VALUE * this.multiplier;
      this.emit('gem');
    }
    this.gems = remaining;
  }

  private resolveHazards(): void {
    if (this.invulnerable > 0 || this.phase !== 'playing') return;
    for (const obstacle of this.obstacles) {
      if (this.hitsObstacle(obstacle)) {
        this.takeHit();
        return;
      }
    }
  }

  hitsObstacle(obstacle: Obstacle): boolean {
    const p = this.player;
    if (obstacle.kind === 'drone') {
      return Math.hypot(obstacle.x - p.x, obstacle.y - p.y) < p.radius + obstacle.radius;
    }
    if (obstacle.kind === 'shard') {
      const halfX = Math.cos(obstacle.angle) * (obstacle.length / 2);
      const halfY = Math.sin(obstacle.angle) * (obstacle.length / 2);
      const distance = pointSegmentDistance(
        p.x,
        p.y,
        obstacle.x - halfX,
        obstacle.y - halfY,
        obstacle.x + halfX,
        obstacle.y + halfY,
      );
      return distance < p.radius + obstacle.thickness / 2;
    }
    // Laser gate: a full-height bar with one safe gap.
    if (
      p.x + p.radius < obstacle.x - obstacle.thickness / 2 ||
      p.x - p.radius > obstacle.x + obstacle.thickness / 2
    ) {
      return false;
    }
    return p.y - p.radius < obstacle.gapY || p.y + p.radius > obstacle.gapY + obstacle.gapHeight;
  }

  private takeHit(): void {
    this.hp -= 1;
    this.invulnerable = 1.5;
    this.shake = 1;
    this.flash = 1;
    this.combo = 0;
    this.multiplier = 1;
    this.comboWindow = 0;

    // Clear nearby hazards so the player is not hit twice by the same cluster.
    this.obstacles = this.obstacles.filter(
      (obstacle) => Math.hypot(obstacle.x - this.player.x, obstacle.y - this.player.y) > 130,
    );

    this.emit('hit');

    if (this.hp <= 0) {
      this.hp = 0;
      this.phase = 'over';
      this.emit('gameover');
    }
  }

  getSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      mode: this.mode,
      score: Math.floor(this.score),
      hp: this.hp,
      maxHp: PLAYER_MAX_HP,
      combo: this.combo,
      bestCombo: this.bestCombo,
      multiplier: this.multiplier,
      level: this.level,
      gems: this.gemsCollected,
      elapsed: this.elapsed,
      invulnerable: this.invulnerable,
    };
  }

  private emit(type: GameEventType): void {
    if (this.onEvent) this.onEvent(type, this.getSnapshot());
  }
}
