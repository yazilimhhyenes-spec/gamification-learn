/** 🗺️ Harita: kahramanla yürüyüp bölüm binalarına girdiğin 2D dünya. */
import { drawHero, ell, poly, rrect, type Ctx, type HeroKind } from './art';
import type { View } from './stage';
import { session } from './state';

export type PoiId = number | 'lab' | 'codex' | 'exam';
export const WW = 960;
export const WH = 544;
const T = 32;
const COLS = 30;
const ROWS = 17;

export interface Poi {
  id: PoiId; label: string; x0: number; y0: number; wall: string; roof: string; icon: string;
}
export const POIS: Poi[] = [
  { id: 1, label: 'Class & Object', x0: 1, y0: 1, wall: '#f1d9a6', roof: '#d9654f', icon: '1' },
  { id: 2, label: 'Encapsulation', x0: 7, y0: 1, wall: '#c9d3ea', roof: '#5b7fd1', icon: '2' },
  { id: 3, label: 'Inheritance', x0: 13, y0: 1, wall: '#cfe8c4', roof: '#3f9a56', icon: '3' },
  { id: 4, label: 'Polymorphism', x0: 19, y0: 1, wall: '#f2cfe0', roof: '#b04f8a', icon: '4' },
  { id: 5, label: 'Abstraction', x0: 25, y0: 1, wall: '#cfe6f2', roof: '#3a86d6', icon: '5' },
  { id: 6, label: 'Interfaces', x0: 1, y0: 6, wall: '#f6e2b8', roof: '#d6902f', icon: '6' },
  { id: 7, label: 'Composition', x0: 7, y0: 6, wall: '#e5d0c8', roof: '#c9573a', icon: '7' },
  { id: 8, label: 'Static & Overload', x0: 13, y0: 6, wall: '#cfe3ef', roof: '#2f78c9', icon: '8' },
  { id: 9, label: 'SOLID I', x0: 19, y0: 6, wall: '#e4d4f2', roof: '#8a4fd1', icon: '9' },
  { id: 10, label: 'SOLID II', x0: 25, y0: 6, wall: '#d4e0e0', roof: '#3f7f86', icon: '10' },
  { id: 'lab', label: 'Rün Laboratuvarı', x0: 1, y0: 11, wall: '#d9d0f5', roof: '#6a49c8', icon: '🔮' },
  { id: 'codex', label: 'Sözlük Kütüphanesi', x0: 7, y0: 11, wall: '#e8d9b8', roof: '#8a5a2b', icon: '📖' },
  { id: 11, label: 'FİNAL KALE', x0: 13, y0: 11, wall: '#a9a0b8', roof: '#c0394f', icon: '⚔' },
  { id: 'exam', label: 'Sınav Arenası', x0: 19, y0: 11, wall: '#f0e2b0', roof: '#e0a020', icon: '🏆' },
];

const doorOf = (p: Poi): { x: number; y: number } => ({ x: (p.x0 + 2) * T, y: (p.y0 + 3) * T + 16 });

/** Basit deterministik rastgele */
const rnd = (n: number): number => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

interface Tree { x: number; y: number; s: number }

export class WorldView implements View {
  private t = 0;
  private px = 12 * T;
  private py = 9 * T + 16;
  private facing: 1 | -1 = 1;
  private moving = false;
  private keys = new Set<string>();
  private blocked: boolean[][] = [];
  private trees: Tree[] = [];
  private bg: HTMLCanvasElement;
  private hover: Poi | null = null;
  private auto: { x: number; y: number; poi: Poi } | null = null;
  private clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 210, y: 20 + (i % 3) * 14, s: 0.8 + (i % 2) * 0.4 }));
  near: Poi | null = null;
  onEnter: (p: Poi) => void = () => {};

  constructor(private canvas: HTMLCanvasElement) {
    this.blocked = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
    const road = (x: number, y: number): boolean => y === 4 || y === 9 || y === 14 || x === 11 || x === 12 || x === 23 || x === 24;
    for (const p of POIS) for (let y = p.y0; y < p.y0 + 3; y++) for (let x = p.x0; x < p.x0 + 4; x++) this.blocked[y][x] = true;
    // pond (sağ alt) ve ağaçlar
    for (let y = 11; y <= 13; y++) for (let x = 25; x <= 28; x++) this.blocked[y][x] = true;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (this.blocked[y][x] || road(x, y)) continue;
      const edge = y === 0 || y === ROWS - 1 || y === 15 || y === 16 || x === 0 || x === COLS - 1;
      const gap = (y >= 1 && y <= 13) && [5, 6, 17, 18].includes(x) && !road(x, y);
      if ((edge && rnd(x * 31 + y) < 0.5) || (gap && rnd(x * 17 + y * 5) < 0.4)) {
        this.blocked[y][x] = true;
        this.trees.push({ x: x * T + 16 + (rnd(x + y) - 0.5) * 8, y: y * T + 30, s: 0.85 + rnd(x * y + 3) * 0.5 });
      }
    }
    this.bg = this.buildBackground(road);

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        if (this.canvas.offsetParent !== null) { this.keys.add(k); this.auto = null; e.preventDefault(); }
      }
      if ((k === 'e' || k === 'enter' || k === ' ') && this.canvas.offsetParent !== null && this.near) { e.preventDefault(); this.onEnter(this.near); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousemove', (e) => { this.hover = this.poiAt(e); canvas.style.cursor = this.hover ? 'pointer' : 'default'; });
    canvas.addEventListener('mouseleave', () => { this.hover = null; });
    canvas.addEventListener('click', (e) => {
      const p = this.poiAt(e);
      if (p) { const d = doorOf(p); this.auto = { x: d.x, y: d.y, poi: p }; }
    });
  }

  private poiAt(e: MouseEvent): Poi | null {
    const r = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * WW, y = ((e.clientY - r.top) / r.height) * WH;
    return POIS.find((p) => x >= p.x0 * T - 6 && x <= (p.x0 + 4) * T + 6 && y >= p.y0 * T - 20 && y <= (p.y0 + 3) * T + 30) ?? null;
  }

  private buildBackground(road: (x: number, y: number) => boolean): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = WW * 2; cv.height = WH * 2;
    const c = cv.getContext('2d') as Ctx;
    c.scale(2, 2);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      c.fillStyle = (x + y) % 2 ? '#62b360' : '#5aab59';
      c.fillRect(x * T, y * T, T, T);
    }
    // çim tutamları
    for (let i = 0; i < 220; i++) {
      const gx = rnd(i * 3.3) * WW, gy = rnd(i * 7.1) * WH;
      c.strokeStyle = 'rgba(40,110,50,.55)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - 2, gy - 5); c.moveTo(gx, gy); c.lineTo(gx + 2, gy - 6); c.stroke();
    }
    // çiçekler
    for (let i = 0; i < 70; i++) {
      const fx = rnd(i * 5.9) * WW, fy = rnd(i * 2.3 + 9) * WH;
      ell(c, fx, fy, 2.6, 2.6, ['#ffd24d', '#ff8aa0', '#fff', '#b78cff'][i % 4], null);
    }
    // yollar
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (!road(x, y)) continue;
      c.fillStyle = (x + y) % 2 ? '#d9bd8a' : '#d2b480';
      c.fillRect(x * T, y * T, T, T);
      if (rnd(x * 9 + y * 4) < 0.35) ell(c, x * T + rnd(x + y) * T, y * T + rnd(x * y + 1) * T, 2.5, 1.6, '#b99a66', null);
    }
    // gölet
    rrect(c, 25 * T - 6, 11 * T - 6, 4 * T + 12, 3 * T + 12, 26, '#e3d3a0', null);
    rrect(c, 25 * T, 11 * T, 4 * T, 3 * T, 22, '#58b4e0', '#3f8fbf', 3);
    return cv;
  }

  update(dt: number): void {
    this.t += dt;
    for (const cl of this.clouds) { cl.x += dt * 8 * cl.s; if (cl.x > WW + 100) cl.x = -100; }
    let dx = 0, dy = 0;
    const k = this.keys;
    if (k.has('arrowleft') || k.has('a')) dx -= 1;
    if (k.has('arrowright') || k.has('d')) dx += 1;
    if (k.has('arrowup') || k.has('w')) dy -= 1;
    if (k.has('arrowdown') || k.has('s')) dy += 1;
    if (this.auto) {
      const ax = this.auto.x - this.px, ay = this.auto.y - this.py, d = Math.hypot(ax, ay);
      if (d < 6) { const p = this.auto.poi; this.auto = null; this.onEnter(p); }
      else { dx = ax / d; dy = ay / d; this.px += dx * 260 * dt; this.py += dy * 260 * dt; this.moving = true; if (dx) this.facing = dx > 0 ? 1 : -1; this.updateNear(); return; }
    }
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
      if (dx) this.facing = dx > 0 ? 1 : -1;
      const sp = 150 * dt;
      const nx = this.px + dx * sp;
      if (!this.hit(nx, this.py)) this.px = nx;
      const ny = this.py + dy * sp;
      if (!this.hit(this.px, ny)) this.py = ny;
    }
    this.updateNear();
  }

  private hit(x: number, y: number): boolean {
    for (const [ox, oy] of [[-9, 0], [9, 0], [-9, -8], [9, -8]]) {
      const tx = Math.floor((x + ox) / T), ty = Math.floor((y + oy) / T);
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || this.blocked[ty][tx]) return true;
    }
    return false;
  }

  private updateNear(): void {
    this.near = null;
    for (const p of POIS) {
      const d = doorOf(p);
      if (Math.abs(this.px - d.x) < 34 && Math.abs(this.py - d.y) < 30) { this.near = p; break; }
    }
  }

  private nextId(): PoiId | null {
    for (let i = 1; i <= 11; i++) if (!session.done.includes(i)) return i;
    return session.done.includes(12) ? null : 'exam';
  }

  private drawTree(c: Ctx, tr: Tree): void {
    const sway = Math.sin(this.t * 1.3 + tr.x) * 1.5;
    c.save(); c.translate(tr.x, tr.y); c.scale(tr.s, tr.s);
    ell(c, 0, 0, 16, 5, 'rgba(0,0,0,.2)', null);
    rrect(c, -4, -22, 8, 22, 3, '#7a4b2a');
    ell(c, sway, -40, 22, 24, '#2f8f4a'); ell(c, 8 + sway, -34, 14, 14, '#3aa557', null); ell(c, -9 + sway, -50, 13, 12, '#3aa557', null);
    c.restore();
  }

  private drawBuilding(c: Ctx, p: Poi): void {
    const x = p.x0 * T, y = p.y0 * T, w = 4 * T;
    const done = session.done.includes(typeof p.id === 'number' ? p.id : p.id === 'exam' ? 12 : -1);
    const isNext = this.nextId() === p.id;
    const hov = this.hover === p || this.near === p;
    const lift = hov ? -3 : 0;
    c.save(); c.translate(0, lift);
    ell(c, x + w / 2, y + 96, w / 2 + 6, 8, 'rgba(0,0,0,.22)', null);
    // duvar
    rrect(c, x + 6, y + 36, w - 12, 62, 4, p.wall);
    // çatı
    poly(c, [[x - 4, y + 42], [x + w + 4, y + 42], [x + w - 16, y + 4], [x + 16, y + 4]], p.roof);
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + 14 + i * 24, y + 6); c.lineTo(x + 6 + i * 26, y + 41); c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 2; c.stroke(); }
    // kapı
    rrect(c, x + w / 2 - 14, y + 62, 28, 36, 14, '#5a3a22'); ell(c, x + w / 2 + 7, y + 82, 2.5, 2.5, '#f5c84c', null);
    // pencereler
    for (const wx of [x + 22, x + w - 44]) { rrect(c, wx, y + 56, 22, 20, 4, '#9fd8ff'); c.strokeStyle = '#5a3a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(wx + 11, y + 56); c.lineTo(wx + 11, y + 76); c.moveTo(wx, y + 66); c.lineTo(wx + 22, y + 66); c.stroke(); }
    // rozet
    const bx = x + w / 2, by = y + 2;
    ell(c, bx, by, 15, 15, isNext ? '#ffd24d' : '#fff7e0', '#1b1730', 2.5);
    c.font = `800 ${String(p.icon).length > 2 ? 13 : 15}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1b1730';
    c.fillText(String(p.icon), bx, by + 1);
    // etiket
    c.font = '800 11px system-ui';
    const tw = c.measureText(p.label).width;
    rrect(c, bx - tw / 2 - 8, y + 20, tw + 16, 17, 8, 'rgba(27,23,48,.82)', null);
    c.fillStyle = '#fff'; c.fillText(p.label, bx, y + 29);
    c.textBaseline = 'alphabetic';
    if (done) { ell(c, x + w - 8, y + 18, 11, 11, '#3fcf7f', '#1b1730', 2); c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + w - 13, y + 18); c.lineTo(x + w - 9, y + 22); c.lineTo(x + w - 3, y + 14); c.stroke(); }
    c.restore();
    if (isNext) {
      const d = doorOf(p), a = Math.sin(this.t * 5) * 4;
      c.save(); c.globalAlpha = 0.5 + 0.3 * Math.sin(this.t * 4);
      ell(c, d.x, d.y - 4, 22, 9, 'rgba(255,210,77,.55)', '#ffd24d', 2); c.restore();
      poly(c, [[d.x - 9, d.y - 40 + a], [d.x + 9, d.y - 40 + a], [d.x, d.y - 26 + a]], '#ffd24d');
    }
  }

  draw(c: Ctx): void {
    const t = this.t;
    c.drawImage(this.bg, 0, 0, WW, WH);
    // gölet animasyonu
    c.save(); c.beginPath(); c.roundRect(25 * T, 11 * T, 4 * T, 3 * T, 22); c.clip();
    for (let i = 0; i < 6; i++) { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.beginPath(); const yy = 11 * T + 14 + i * 14; c.moveTo(25 * T + 8, yy); for (let x = 0; x <= 4 * T - 16; x += 8) c.lineTo(25 * T + 8 + x, yy + Math.sin(t * 2 + x * 0.1 + i) * 2.5); c.stroke(); }
    ell(c, 26.5 * T, 12.4 * T, 9, 5, '#58c46a', null); ell(c, 27.6 * T, 11.8 * T, 7, 4, '#58c46a', null);
    c.restore();
    for (const cl of this.clouds) { c.globalAlpha = 0.28; ell(c, cl.x, cl.y, 52 * cl.s, 14 * cl.s, '#fff', null); }
    c.globalAlpha = 1;

    type Item = { y: number; draw: () => void };
    const items: Item[] = [];
    for (const tr of this.trees) items.push({ y: tr.y, draw: () => this.drawTree(c, tr) });
    for (const p of POIS) items.push({ y: (p.y0 + 3) * T - 4, draw: () => this.drawBuilding(c, p) });
    const kind: HeroKind = (({ Warrior: 'warrior', Mage: 'mage', Archer: 'archer' }) as Record<string, HeroKind>)[session.player?.constructor.name ?? ''] ?? 'novice';
    items.push({ y: this.py, draw: () => drawHero(c, kind, this.px, this.py + 4, { s: 0.62, t, walk: this.moving, facing: this.facing }) });
    items.sort((a, b) => a.y - b.y).forEach((i) => i.draw());

    // yakındaki bina için ipucu
    const target = this.near ?? null;
    if (target) {
      const label = `E / Enter  ·  ${target.label}`;
      c.font = '800 13px system-ui'; c.textAlign = 'center';
      const tw = c.measureText(label).width;
      const bx = Math.max(tw / 2 + 12, Math.min(WW - tw / 2 - 12, this.px)), by = this.py - 62;
      rrect(c, bx - tw / 2 - 10, by - 17, tw + 20, 26, 10, 'rgba(27,23,48,.92)', '#ffd24d', 2);
      c.fillStyle = '#ffd24d'; c.fillText(label, bx, by + 1);
    }
  }
}
