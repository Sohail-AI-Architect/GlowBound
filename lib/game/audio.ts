/**
 * Tiny synthesised sound engine (Web Audio API).
 *
 * No audio files are shipped: every cue is generated with oscillators, which
 * keeps the bundle small and avoids extra network requests. The AudioContext is
 * created lazily on the first user gesture to satisfy autoplay policies.
 */
export type SoundName = 'gem' | 'hit' | 'levelup' | 'gameover' | 'start' | 'click';

export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.context) return this.context;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.context.destination);
    return this.context;
  }

  /** Call from a user gesture handler before playing anything. */
  unlock(): void {
    const context = this.ensureContext();
    if (context && context.state === 'suspended') void context.resume();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(enabled ? 0.35 : 0, this.context.currentTime, 0.02);
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return;
    const context = this.ensureContext();
    if (!context || !this.master) return;
    if (context.state === 'suspended') void context.resume();

    const now = context.currentTime;
    switch (name) {
      case 'gem':
        this.tone(now, 660, 990, 0.12, 'sine', 0.5);
        break;
      case 'hit':
        this.tone(now, 220, 70, 0.32, 'sawtooth', 0.55);
        break;
      case 'levelup':
        this.tone(now, 520, 780, 0.18, 'triangle', 0.35);
        this.tone(now + 0.1, 780, 1040, 0.2, 'triangle', 0.3);
        break;
      case 'gameover':
        this.tone(now, 440, 220, 0.35, 'triangle', 0.4);
        this.tone(now + 0.16, 330, 110, 0.5, 'sine', 0.32);
        break;
      case 'start':
        this.tone(now, 330, 660, 0.2, 'sine', 0.4);
        break;
      case 'click':
        this.tone(now, 880, 880, 0.05, 'square', 0.18);
        break;
    }
  }

  private tone(
    start: number,
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  dispose(): void {
    if (this.context && this.context.state !== 'closed') {
      void this.context.close();
    }
    this.context = null;
    this.master = null;
  }
}
