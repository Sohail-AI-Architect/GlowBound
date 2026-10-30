/**
 * Canvas renderer for GlowBound.
 *
 * Draws in CSS pixels: the caller sets the device-pixel-ratio transform once per
 * resize. The renderer owns purely visual state (trail, particles, starfield) so
 * the engine stays deterministic and testable.
 */
import type { Gem, GlowBoundEngine, Obstacle } from './engine';

const TAU = Math.PI * 2;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

export interface RenderPrefs {
  reducedMotion: boolean;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private stars: Star[] = [];
  private starWidth = 0;
  private starHeight = 0;
  private trail: { x: number; y: number; life: number }[] = [];
  private particles: Particle[] = [];
  private time = 0;
  private lastGems = 0;
  private lastHp = -1;
  private prefs: RenderPrefs = { reducedMotion: false };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D context is not available in this browser.');
    this.canvas = canvas;
    this.ctx = ctx;
  }

  setPrefs(prefs: RenderPrefs): void {
    this.prefs = prefs;
    if (prefs.reducedMotion) {
      this.particles = [];
      this.trail = [];
    }
  }

  /** Sync the backing store with the CSS size, capped DPR to keep fill-rate sane. */
  resize(cssWidth: number, cssHeight: number): void {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    this.canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ensureStars(cssWidth, cssHeight);
  }

  reset(): void {
    this.trail = [];
    this.particles = [];
    this.lastGems = 0;
    this.lastHp = -1;
  }

  private ensureStars(width: number, height: number): void {
    if (width === this.starWidth && height === this.starHeight) return;
    this.starWidth = width;
    this.starHeight = height;
    const count = Math.round(Math.min(110, Math.max(28, (width * height) / 9000)));
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.4 + 0.4,
      phase: Math.random() * TAU,
    }));
  }

  render(engine: GlowBoundEngine, dt: number): void {
    const { ctx } = this;
    const width = engine.width;
    const height = engine.height;
    this.time += dt;
    this.ensureStars(width, height);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    if (!this.prefs.reducedMotion && engine.shake > 0) {
      const magnitude = engine.shake * 9;
      ctx.translate((Math.random() - 0.5) * magnitude, (Math.random() - 0.5) * magnitude);
    }

    this.drawBackground(width, height);
    this.drawGrid(width, height);
    this.drawStars();
    this.drawGems(engine);
    this.drawObstacles(engine);
    this.drawPlayer(engine, dt);
    this.drawParticles(dt);
    ctx.restore();

    this.drawOverlay(engine, width, height);
    this.syncFeedback(engine);
  }

  private drawBackground(width: number, height: number): void {
    const { ctx } = this;
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, '#050313');
    base.addColorStop(0.5, '#090720');
    base.addColorStop(1, '#0d0524');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.46,
      0,
      width * 0.5,
      height * 0.46,
      Math.max(width, height) * 0.7,
    );
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
    glow.addColorStop(0.45, 'rgba(139, 92, 246, 0.1)');
    glow.addColorStop(1, 'rgba(4, 3, 11, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  private drawGrid(width: number, height: number): void {
    const { ctx } = this;
    const spacing = width < 520 ? 46 : 64;
    ctx.save();
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = spacing; x < width; x += spacing) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = spacing; y < height; y += spacing) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawStars(): void {
    const { ctx } = this;
    ctx.save();
    for (const star of this.stars) {
      const alpha = 0.22 + 0.34 * (0.5 + 0.5 * Math.sin(this.time * 1.2 + star.phase));
      ctx.fillStyle = `rgba(196, 181, 253, ${alpha.toFixed(3)})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }

  private drawGems(engine: GlowBoundEngine): void {
    const { ctx } = this;
    for (const gem of engine.gems) {
      this.drawGem(gem);
    }
  }

  private drawGem(gem: Gem): void {
    const { ctx } = this;
    const bob = this.prefs.reducedMotion ? 0 : Math.sin(gem.phase) * 2.2;
    const x = gem.x;
    const y = gem.y + bob;
    const r = gem.radius * (1 + Math.sin(gem.phase * 1.6) * 0.06);

    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
    halo.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
    halo.addColorStop(0.5, 'rgba(56, 189, 248, 0.16)');
    halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.4, 0, TAU);
    ctx.fill();

    ctx.translate(x, y);
    ctx.rotate(this.time * 1.1 + gem.phase);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.72, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.72, 0);
    ctx.closePath();
    const body = ctx.createLinearGradient(-r, -r, r, r);
    body.addColorStop(0, '#a5f3fc');
    body.addColorStop(0.5, '#38bdf8');
    body.addColorStop(1, '#c4b5fd');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 249, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  private drawObstacles(engine: GlowBoundEngine): void {
    for (const obstacle of engine.obstacles) {
      if (obstacle.kind === 'shard') this.drawShard(obstacle);
      else if (obstacle.kind === 'drone') this.drawDrone(obstacle);
      else this.drawGate(obstacle, engine.height);
    }
  }

  private drawShard(obstacle: Obstacle): void {
    const { ctx } = this;
    const half = obstacle.length / 2;
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.angle);
    ctx.lineCap = 'round';

    ctx.strokeStyle = 'rgba(236, 72, 153, 0.2)';
    ctx.lineWidth = obstacle.thickness + 10;
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.stroke();

    const gradient = ctx.createLinearGradient(-half, 0, half, 0);
    gradient.addColorStop(0, '#f472b6');
    gradient.addColorStop(0.55, '#ec4899');
    gradient.addColorStop(1, '#a855f7');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = obstacle.thickness;
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 241, 250, 0.75)';
    ctx.lineWidth = Math.max(1, obstacle.thickness * 0.22);
    ctx.beginPath();
    ctx.moveTo(-half + 4, 0);
    ctx.lineTo(half - 4, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawDrone(obstacle: Obstacle): void {
    const { ctx } = this;
    const r = obstacle.radius;
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    const halo = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.2);
    halo.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
    halo.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, TAU);
    ctx.fill();

    ctx.rotate(obstacle.angle);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const body = ctx.createLinearGradient(-r, -r, r, r);
    body.addColorStop(0, 'rgba(251, 113, 133, 0.9)');
    body.addColorStop(1, 'rgba(190, 24, 93, 0.9)');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 228, 230, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, TAU);
    ctx.fillStyle = 'rgba(255, 241, 242, 0.95)';
    ctx.fill();
    ctx.restore();
  }

  private drawGate(obstacle: Obstacle, height: number): void {
    const { ctx } = this;
    const x = obstacle.x;
    const halfThickness = obstacle.thickness / 2;
    const gapTop = obstacle.gapY;
    const gapBottom = obstacle.gapY + obstacle.gapHeight;

    ctx.save();
    const beam = ctx.createLinearGradient(x - halfThickness, 0, x + halfThickness, 0);
    beam.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
    beam.addColorStop(0.5, 'rgba(232, 121, 249, 0.95)');
    beam.addColorStop(1, 'rgba(168, 85, 247, 0.15)');
    ctx.fillStyle = beam;
    ctx.fillRect(x - halfThickness, 0, obstacle.thickness, gapTop);
    ctx.fillRect(x - halfThickness, gapBottom, obstacle.thickness, height - gapBottom);

    ctx.fillStyle = 'rgba(240, 171, 252, 0.35)';
    ctx.fillRect(x - halfThickness - 5, 0, 3, gapTop);
    ctx.fillRect(x - halfThickness - 5, gapBottom, 3, height - gapBottom);

    // Emphasise the safe gap so it reads instantly.
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - halfThickness - 8, gapTop);
    ctx.lineTo(x + halfThickness + 8, gapTop);
    ctx.moveTo(x - halfThickness - 8, gapBottom);
    ctx.lineTo(x + halfThickness + 8, gapBottom);
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayer(engine: GlowBoundEngine, dt: number): void {
    const { ctx } = this;
    const p = engine.player;
    const r = p.radius;
    const flicker = engine.invulnerable > 0 ? 0.4 + 0.6 * Math.abs(Math.sin(this.time * 18)) : 1;

    if (!this.prefs.reducedMotion) {
      const last = this.trail[this.trail.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2.5) {
        this.trail.push({ x: p.x, y: p.y, life: 1 });
        if (this.trail.length > 22) this.trail.shift();
      }
      for (const point of this.trail) point.life -= dt * 2.1;
      this.trail = this.trail.filter((point) => point.life > 0);

      ctx.save();
      for (const point of this.trail) {
        ctx.globalAlpha = Math.max(0, point.life) * 0.35;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(point.x, point.y, r * 0.62 * point.life, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = flicker;
    const halo = ctx.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, r * 3.6);
    halo.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    halo.addColorStop(0.45, 'rgba(139, 92, 246, 0.24)');
    halo.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3.6, 0, TAU);
    ctx.fill();

    const core = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.45, '#a5f3fc');
    core.addColorStop(1, '#38bdf8');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(196, 181, 253, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 4, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 10 + Math.sin(this.time * 3) * 2, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  private drawParticles(dt: number): void {
    if (this.particles.length === 0) return;
    const { ctx } = this;
    ctx.save();
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.97;
      particle.vy *= 0.97;
      particle.life -= dt;
      if (particle.life <= 0) continue;
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  private drawOverlay(engine: GlowBoundEngine, width: number, height: number): void {
    const { ctx } = this;

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    );
    vignette.addColorStop(0, 'rgba(4, 3, 11, 0)');
    vignette.addColorStop(1, 'rgba(4, 3, 11, 0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    if (engine.flash > 0.01) {
      ctx.fillStyle = `rgba(244, 63, 94, ${(engine.flash * 0.22).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (engine.hp === 1 && engine.phase === 'playing') {
      const pulse = 0.06 + 0.05 * Math.sin(this.time * 5);
      const danger = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7,
      );
      danger.addColorStop(0, 'rgba(244, 63, 94, 0)');
      danger.addColorStop(1, `rgba(244, 63, 94, ${pulse.toFixed(3)})`);
      ctx.fillStyle = danger;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /** Turn score/hp deltas into visual feedback without coupling the engine to drawing. */
  private syncFeedback(engine: GlowBoundEngine): void {
    if (engine.gemsCollected > this.lastGems) {
      this.burst(engine.player.x, engine.player.y, '#38bdf8', 14);
    }
    this.lastGems = engine.gemsCollected;

    if (this.lastHp === -1) this.lastHp = engine.hp;
    if (engine.hp < this.lastHp) {
      this.burst(engine.player.x, engine.player.y, '#f472b6', 22);
    }
    this.lastHp = engine.hp;
  }

  private burst(x: number, y: number, color: string, count: number): void {
    if (this.prefs.reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const speed = 70 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 1.5 + Math.random() * 2.5,
        color,
      });
    }
  }
}
