/** 🎬 Sahne tuvali: bir "görünüm" (view) çizer; bölüm sahnesi, savaş sahnesi vb. */
import type { Ctx } from './art';

export const W = 640;
export const H = 360;

export interface View {
  update(dt: number): void;
  draw(c: Ctx): void;
}

export class Stage {
  readonly canvas: HTMLCanvasElement;
  private ctx: Ctx;
  private view: View | null = null;
  private last = 0;
  private running = false;
  private w: number;
  private h: number;

  constructor(canvas: HTMLCanvasElement, w = W, h = H) {
    this.canvas = canvas;
    this.w = w; this.h = h;
    canvas.width = w * 2;
    canvas.height = h * 2;
    this.ctx = canvas.getContext('2d') as Ctx;
  }
  setView(v: View | null): void { this.view = v; }
  get current(): View | null { return this.view; }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number): void => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (this.view && this.canvas.offsetParent !== null) {
        this.view.update(dt);
        this.ctx.save();
        this.ctx.scale(2, 2);
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.view.draw(this.ctx);
        this.ctx.restore();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop(): void { this.running = false; }
}

/* ───────────── Ortak efektler: konfeti ve yüzen yazılar ───────────── */
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
export interface Floater { x: number; y: number; text: string; color: string; life: number; max: number; size: number }

export class Effects {
  particles: Particle[] = [];
  floaters: Floater[] = [];
  shake = 0;

  confetti(x: number, y: number, n = 36): void {
    const cols = ['#ffd24d', '#ff6a8a', '#4de1c1', '#7aa7ff', '#b78cff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 1.2, max: 1.2, color: cols[i % cols.length], size: 3 + Math.random() * 3 });
    }
  }
  sparks(x: number, y: number, color = '#fff', n = 14): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, max: 0.5, color, size: 2 + Math.random() * 2 });
    }
  }
  float(x: number, y: number, text: string, color = '#fff', size = 18): void {
    this.floaters.push({ x, y, text, color, life: 1.1, max: 1.1, size });
  }
  update(dt: number): void {
    for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) { f.life -= dt; f.y -= 34 * dt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);
    this.shake = Math.max(0, this.shake - dt * 3);
  }
  draw(c: Ctx): void {
    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / p.max);
      c.fillStyle = p.color; c.fillRect(p.x, p.y, p.size, p.size);
    }
    c.globalAlpha = 1;
    for (const f of this.floaters) {
      c.globalAlpha = Math.min(1, f.life / (f.max * 0.5));
      c.font = `800 ${f.size}px system-ui, sans-serif`;
      c.textAlign = 'center';
      c.lineWidth = 4; c.strokeStyle = '#1b1730'; c.strokeText(f.text, f.x, f.y);
      c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
    }
    c.globalAlpha = 1;
  }
}
