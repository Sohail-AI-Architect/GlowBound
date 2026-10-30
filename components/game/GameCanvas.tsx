'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameSnapshot, GlowBoundEngine } from '@/lib/game/engine';
import { GameRenderer } from '@/lib/game/renderer';

const MOVE_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w',
  'a',
  's',
  'd',
]);

interface GameCanvasProps {
  engine: GlowBoundEngine;
  onSnapshot: (snapshot: GameSnapshot) => void;
  reducedMotion: boolean;
}

function canvasIsSupported(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    return Boolean(document.createElement('canvas').getContext('2d'));
  } catch {
    return false;
  }
}

/**
 * Owns the requestAnimationFrame loop, canvas sizing and all raw input.
 * Game rules live in the engine; drawing lives in the renderer.
 */
export function GameCanvas({ engine, onSnapshot, reducedMotion }: GameCanvasProps) {
  const [supported] = useState(canvasIsSupported);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GlowBoundEngine | null>(engine);
  const snapshotRef = useRef(onSnapshot);
  const rendererRef = useRef<GameRenderer | null>(null);
  const prefsRef = useRef(reducedMotion);

  // Render loop + sizing. Runs once; engine swaps are handled by the effect below.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let renderer: GameRenderer;
    try {
      renderer = new GameRenderer(canvas);
    } catch (error) {
      // Canvas 2D can be unavailable (blocked or exhausted context). The
      // surrounding UI stays usable and the fallback message explains why.
      console.error('GlowBound: unable to create the canvas renderer.', error);
      return;
    }
    rendererRef.current = renderer;
    renderer.setPrefs({ reducedMotion: prefsRef.current });

    let lastWidth = 0;
    let lastHeight = 0;
    // The loop idles while the menu, pause and results overlays are shown: one
    // frame is drawn after each resize or while playing, then the canvas rests.
    let needsFrame = true;
    let lastPhase: string | null = null;
    const applySize = () => {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      renderer.resize(width, height);
      engineRef.current?.resize(width, height);
      needsFrame = true;
    };
    applySize();

    const observer = new ResizeObserver(applySize);
    observer.observe(wrap);

    let frameId = 0;
    let lastTime = performance.now();
    let lastHudPush = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const current = engineRef.current;
      if (current) {
        current.update(dt);
        if (current.phase !== lastPhase) {
          // Clear trail and particles whenever a run starts or ends so a
          // restart never inherits visuals from the previous attempt.
          if (current.phase === 'playing' || current.phase === 'menu') renderer.reset();
          lastPhase = current.phase;
          needsFrame = true;
        }
        const running = current.phase === 'playing';
        if (running || needsFrame) {
          renderer.render(current, dt);
          needsFrame = false;
        }
        if (running && now - lastHudPush > 100) {
          lastHudPush = now;
          snapshotRef.current(current.getSnapshot());
        }
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      rendererRef.current = null;
    };
  }, []);

  // A new engine (mode switch) needs the current canvas size and a fresh frame.
  useEffect(() => {
    engineRef.current = engine;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    engine.resize(width, height);
    rendererRef.current?.reset();
    rendererRef.current?.render(engine, 0);
  }, [engine]);

  useEffect(() => {
    snapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  useEffect(() => {
    prefsRef.current = reducedMotion;
    rendererRef.current?.setPrefs({ reducedMotion });
  }, [reducedMotion]);

  // Pointer / touch steering.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragging = false;
    const drag = { startX: 0, startY: 0, playerX: 0, playerY: 0 };

    const localPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerDown = (event: PointerEvent) => {
      const current = engineRef.current;
      if (!current || current.phase !== 'playing') return;
      const point = localPoint(event);
      dragging = true;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort.
      }
      if (event.pointerType === 'mouse') {
        current.setTarget(point.x, point.y);
      } else {
        drag.startX = point.x;
        drag.startY = point.y;
        drag.playerX = current.player.x;
        drag.playerY = current.player.y;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const current = engineRef.current;
      if (!current || !dragging) return;
      const point = localPoint(event);
      if (event.pointerType === 'mouse') {
        current.setTarget(point.x, point.y);
      } else {
        // Relative drag: the orb mirrors your thumb without hiding it.
        current.setTarget(
          drag.playerX + (point.x - drag.startX),
          drag.playerY + (point.y - drag.startY),
        );
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (event.pointerType !== 'mouse') engineRef.current?.clearTarget();
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  // Keyboard steering. Arrow keys only take over scrolling while a run is live.
  useEffect(() => {
    const pressed = new Set<string>();

    const apply = () => {
      const right = pressed.has('ArrowRight') || pressed.has('d') ? 1 : 0;
      const left = pressed.has('ArrowLeft') || pressed.has('a') ? 1 : 0;
      const down = pressed.has('ArrowDown') || pressed.has('s') ? 1 : 0;
      const up = pressed.has('ArrowUp') || pressed.has('w') ? 1 : 0;
      engineRef.current?.setInput(right - left, down - up);
    };

    const normalize = (event: KeyboardEvent) =>
      event.key.length === 1 ? event.key.toLowerCase() : event.key;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = normalize(event);
      if (!MOVE_KEYS.has(key)) return;
      if (engineRef.current?.phase !== 'playing') return;
      event.preventDefault();
      pressed.add(key);
      apply();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = normalize(event);
      if (!MOVE_KEYS.has(key)) return;
      pressed.delete(key);
      apply();
    };

    const onBlur = () => {
      pressed.clear();
      apply();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-void-950"
    >
      {supported ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          aria-hidden="true"
        />
      ) : (
        <p role="status" className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-300">
          This browser cannot draw the GlowBound arena (Canvas 2D is unavailable). The rest of the
          page is still readable, and the game works in a current version of Chrome, Edge, Firefox or
          Safari.
        </p>
      )}
    </div>
  );
}
