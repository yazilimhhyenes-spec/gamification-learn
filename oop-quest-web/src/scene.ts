/** 🏞️ Bölüm sahneleri: temalı arka plan + Bilge NPC + kahraman + tepki efektleri. */
import { drawHero, drawSage, drawSlime, ell, line, poly, rrect, type Ctx, type HeroKind } from './art';
import { Effects, H, W, type View } from './stage';
import { session } from './state';
import { hooks, theme } from './ui';

export type SceneKey = number | 'lab' | 'exam';

interface Theme {
  name: string; night?: boolean; sky: [string, string]; ground: [string, string]; hill: string; robe: string; prop: string;
}
const THEMES: Record<string, Theme> = {
  '1': { name: 'Kalıp Atölyesi', sky: ['#ffae7a', '#ffe7b8'], ground: ['#6fbf6a', '#4a9a52'], hill: '#8fcf8a', robe: '#2fb8a6', prop: 'forge' },
  '2': { night: true, name: 'Kapsül Kasası', sky: ['#27325f', '#5a6cb0'], ground: ['#4c5a8c', '#37426b'], hill: '#3a4778', robe: '#7d5bd6', prop: 'vault' },
  '3': { name: 'Soy Ağacı Ormanı', sky: ['#79c9a0', '#d3f0cd'], ground: ['#5fae5e', '#3f8a49'], hill: '#7fc47f', robe: '#2f9e6f', prop: 'tree' },
  '4': { night: true, name: 'Maske Tiyatrosu', sky: ['#4a2f6d', '#b565b3'], ground: ['#7d4a6e', '#5a3350'], hill: '#69407e', robe: '#d6567d', prop: 'stage' },
  '5': { name: 'Soyutlama Çizim Masası', sky: ['#2f6a9a', '#a4d6f2'], ground: ['#6aa5bd', '#4a8aa5'], hill: '#7fb6d1', robe: '#3a86d6', prop: 'blueprint' },
  '6': { name: 'Sözleşme Köprüsü', sky: ['#f29a52', '#ffe2a6'], ground: ['#c99a5b', '#a87a40'], hill: '#e1b573', robe: '#d6902f', prop: 'scroll' },
  '7': { name: 'Silah Atölyesi', sky: ['#66788c', '#cfd9e2'], ground: ['#7c8794', '#5b6572'], hill: '#8d99a6', robe: '#c9573a', prop: 'rack' },
  '8': { name: 'Statik Meydan', sky: ['#3b80ab', '#abdcec'], ground: ['#7cb2c4', '#5a97ad'], hill: '#8fc2d3', robe: '#2f78c9', prop: 'pillars' },
  '9': { night: true, name: 'Denge Kulesi', sky: ['#5b4a8a', '#d1b2ee'], ground: ['#8a73b8', '#6a5798'], hill: '#7d68ad', robe: '#a44fd1', prop: 'scale' },
  '10': { night: true, name: 'SOLID Surları', sky: ['#2c3c4c', '#7a98ab'], ground: ['#56707f', '#3e5461'], hill: '#4a6372', robe: '#4f8a8a', prop: 'wall' },
  '11': { night: true, name: 'Ejderha Kalesi', sky: ['#4a1f2f', '#e0575f'], ground: ['#5a2f3c', '#3b1d28'], hill: '#6b2f3f', robe: '#d9454f', prop: 'castle' },
  lab: { night: true, name: 'Rün Laboratuvarı', sky: ['#1c1f4a', '#5a49a8'], ground: ['#3a3a78', '#27275a'], hill: '#2f2f68', robe: '#8e5bd6', prop: 'runes' },
  exam: { name: 'Sınav Arenası', sky: ['#2a2a45', '#f2c04c'], ground: ['#b58b4a', '#8a6a35'], hill: '#7a6a5a', robe: '#e0b030', prop: 'arena' },
};

const GROUND_Y = 300;

function prop(c: Ctx, kind: string, t: number): void {
  const cx = 320;
  c.save();
  switch (kind) {
    case 'forge': {
      poly(c, [[cx - 40, GROUND_Y - 6], [cx + 40, GROUND_Y - 6], [cx + 28, GROUND_Y - 30], [cx - 28, GROUND_Y - 30]], '#59607a');
      rrect(c, cx - 52, GROUND_Y - 44, 104, 16, 4, '#7a829c');
      rrect(c, cx - 22, GROUND_Y - 4, 44, 8, 3, '#3a3f56');
      ell(c, cx - 118, GROUND_Y - 6, 30, 9, '#3a3f56');
      for (let i = 0; i < 4; i++) {
        const fl = Math.sin(t * 9 + i * 1.7);
        poly(c, [[cx - 138 + i * 12, GROUND_Y - 8], [cx - 132 + i * 12, GROUND_Y - 34 - fl * 6], [cx - 126 + i * 12, GROUND_Y - 8]], i % 2 ? '#ffb13d' : '#ff6a3d', null);
      }
      for (let i = 0; i < 3; i++) { rrect(c, cx + 62 + i * 26, GROUND_Y - 62, 20, 18, 9, ['#ffd24d', '#7aa7ff', '#ff8a9a'][i]); }
      rrect(c, cx + 52, GROUND_Y - 46, 90, 5, 2, '#7a4b2a');
      break;
    }
    case 'vault': {
      ell(c, cx, GROUND_Y - 78, 82, 82, '#56608d'); ell(c, cx, GROUND_Y - 78, 66, 66, '#6d78a8');
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ell(c, cx + Math.cos(a) * 74, GROUND_Y - 78 + Math.sin(a) * 74, 4, 4, '#aab4d8', null); }
      c.save(); c.translate(cx, GROUND_Y - 78); c.rotate(t * 0.4);
      for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); rrect(c, -4, -38, 8, 38, 3, '#e8c25a'); }
      c.restore();
      ell(c, cx, GROUND_Y - 78, 14, 14, '#e8c25a');
      rrect(c, cx + 100, GROUND_Y - 36, 54, 36, 5, '#8a5a2b'); rrect(c, cx + 100, GROUND_Y - 36, 54, 12, 5, '#a8702f'); rrect(c, cx + 121, GROUND_Y - 30, 12, 12, 3, '#f5c84c');
      break;
    }
    case 'tree': {
      rrect(c, cx - 10, GROUND_Y - 120, 20, 120, 6, '#7a4b2a');
      line(c, cx, GROUND_Y - 90, cx - 70, GROUND_Y - 130, '#7a4b2a', 8); line(c, cx, GROUND_Y - 90, cx + 70, GROUND_Y - 130, '#7a4b2a', 8);
      ell(c, cx, GROUND_Y - 150, 64, 38, '#3f9a56'); ell(c, cx - 70, GROUND_Y - 130, 32, 22, '#4aae62'); ell(c, cx + 70, GROUND_Y - 130, 32, 22, '#4aae62');
      const lab = (x: number, y: number, s: string): void => { rrect(c, x - 34, y - 12, 68, 22, 6, '#f3ead2'); c.font = '700 13px system-ui'; c.fillStyle = '#1b1730'; c.textAlign = 'center'; c.fillText(s, x, y + 4); };
      lab(cx, GROUND_Y - 156, 'Unit'); lab(cx - 70, GROUND_Y - 108, 'Knight'); lab(cx + 70, GROUND_Y - 108, 'Wizard');
      break;
    }
    case 'stage': {
      rrect(c, cx - 130, GROUND_Y - 24, 260, 24, 4, '#8a5a2b');
      poly(c, [[cx - 140, GROUND_Y - 24], [cx - 140, GROUND_Y - 150], [cx - 90, GROUND_Y - 130], [cx - 80, GROUND_Y - 24]], '#c0394f');
      poly(c, [[cx + 140, GROUND_Y - 24], [cx + 140, GROUND_Y - 150], [cx + 90, GROUND_Y - 130], [cx + 80, GROUND_Y - 24]], '#c0394f');
      rrect(c, cx - 140, GROUND_Y - 162, 280, 14, 5, '#e8c25a');
      for (const [mx, col] of [[cx - 38, '#ffd24d'], [cx + 38, '#7aa7ff']] as const) {
        ell(c, mx, GROUND_Y - 80 + Math.sin(t * 2 + mx) * 3, 26, 30, col);
        ell(c, mx - 9, GROUND_Y - 88 + Math.sin(t * 2 + mx) * 3, 4, 5, '#1b1730', null); ell(c, mx + 9, GROUND_Y - 88 + Math.sin(t * 2 + mx) * 3, 4, 5, '#1b1730', null);
        c.beginPath(); c.arc(mx, GROUND_Y - 68 + Math.sin(t * 2 + mx) * 3, 9, mx < cx ? 0.1 * Math.PI : 1.1 * Math.PI, mx < cx ? 0.9 * Math.PI : 1.9 * Math.PI); c.lineWidth = 3; c.strokeStyle = '#1b1730'; c.stroke();
      }
      break;
    }
    case 'blueprint': {
      rrect(c, cx - 100, GROUND_Y - 100, 200, 96, 6, '#2a5ea8');
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1;
      for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(cx - 100 + i * 20, GROUND_Y - 100); c.lineTo(cx - 100 + i * 20, GROUND_Y - 4); c.stroke(); }
      for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(cx - 100, GROUND_Y - 100 + i * 19); c.lineTo(cx + 100, GROUND_Y - 100 + i * 19); c.stroke(); }
      c.setLineDash([6, 4]); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(cx - 60, GROUND_Y - 84, 120, 62); c.setLineDash([]);
      c.font = '700 14px system-ui'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('abstract', cx, GROUND_Y - 50);
      line(c, cx + 120, GROUND_Y - 6, cx + 140, GROUND_Y - 80, '#8a5a2b', 5); line(c, cx + 160, GROUND_Y - 6, cx + 140, GROUND_Y - 80, '#8a5a2b', 5); ell(c, cx + 140, GROUND_Y - 84, 5, 5, '#e8c25a');
      break;
    }
    case 'scroll': {
      rrect(c, cx - 90, GROUND_Y - 120, 180, 100, 8, '#f3ead2');
      rrect(c, cx - 100, GROUND_Y - 128, 20, 116, 10, '#d9c79a'); rrect(c, cx + 80, GROUND_Y - 128, 20, 116, 10, '#d9c79a');
      for (let i = 0; i < 4; i++) line(c, cx - 66, GROUND_Y - 100 + i * 14, cx + 66 - (i % 2) * 24, GROUND_Y - 100 + i * 14, '#9a8c70', 2.5);
      c.font = '700 13px system-ui'; c.fillStyle = '#6a4a2b'; c.textAlign = 'center'; c.fillText('interface Healable', cx, GROUND_Y - 104);
      ell(c, cx + 50, GROUND_Y - 38 + Math.sin(t * 2) * 2, 14, 14, '#c0394f'); c.font = '700 14px system-ui'; c.fillStyle = '#ffd24d'; c.fillText('★', cx + 50, GROUND_Y - 33 + Math.sin(t * 2) * 2);
      break;
    }
    case 'rack': {
      rrect(c, cx - 120, GROUND_Y - 110, 240, 10, 3, '#7a4b2a'); rrect(c, cx - 120, GROUND_Y - 110, 10, 110, 3, '#7a4b2a'); rrect(c, cx + 110, GROUND_Y - 110, 10, 110, 3, '#7a4b2a');
      rrect(c, cx - 120, GROUND_Y - 56, 240, 8, 3, '#7a4b2a');
      line(c, cx - 70, GROUND_Y - 100, cx - 70, GROUND_Y - 22, '#e6edf7', 7); rrect(c, cx - 82, GROUND_Y - 62, 24, 6, 2, '#f5c84c');
      c.beginPath(); c.arc(cx, GROUND_Y - 62, 36, -Math.PI * 0.5, Math.PI * 0.5); c.lineWidth = 5; c.strokeStyle = '#8b5a2b'; c.stroke(); line(c, cx, GROUND_Y - 98, cx, GROUND_Y - 26, '#f3ead2', 1.5);
      line(c, cx + 70, GROUND_Y - 100, cx + 70, GROUND_Y - 22, '#8b5a2b', 6); ell(c, cx + 70, GROUND_Y - 104, 8, 8, '#ff7a3d');
      break;
    }
    case 'pillars': {
      for (const px of [cx - 90, cx + 90]) { rrect(c, px - 22, GROUND_Y - 130, 44, 130, 4, '#cfd9e2'); rrect(c, px - 30, GROUND_Y - 138, 60, 14, 4, '#e8eef4'); rrect(c, px - 30, GROUND_Y - 12, 60, 12, 4, '#e8eef4'); }
      c.font = '800 26px system-ui'; c.fillStyle = '#2f78c9'; c.textAlign = 'center';
      c.fillText(String(1 + (Math.floor(t * 1.5) % 9)), cx - 90, GROUND_Y - 70); c.fillText('∞', cx + 90, GROUND_Y - 70);
      line(c, cx, GROUND_Y, cx, GROUND_Y - 140, '#7a4b2a', 5); poly(c, [[cx, GROUND_Y - 138], [cx + 56, GROUND_Y - 124 + Math.sin(t * 3) * 3], [cx, GROUND_Y - 106]], '#d9454f');
      c.font = '700 12px system-ui'; c.fillStyle = '#fff'; c.fillText('static', cx + 24, GROUND_Y - 119);
      break;
    }
    case 'scale': {
      const tilt = Math.sin(t * 0.9) * 0.14;
      rrect(c, cx - 6, GROUND_Y - 140, 12, 140, 4, '#7a6a52'); rrect(c, cx - 36, GROUND_Y - 10, 72, 10, 4, '#7a6a52');
      c.save(); c.translate(cx, GROUND_Y - 138); c.rotate(tilt);
      rrect(c, -100, -5, 200, 10, 5, '#e8c25a');
      for (const sx of [-100, 100]) { line(c, sx, 3, sx - 24, 50, '#7a6a52', 2); line(c, sx, 3, sx + 24, 50, '#7a6a52', 2); ell(c, sx, 52, 28, 7, '#e8c25a'); }
      c.restore();
      c.font = '800 20px system-ui'; c.textAlign = 'center'; c.fillStyle = '#fff';
      c.fillText('S', cx - 100 * Math.cos(tilt), GROUND_Y - 138 - 100 * Math.sin(tilt) + 36 + 3); c.fillText('O', cx + 100 * Math.cos(tilt), GROUND_Y - 138 + 100 * Math.sin(tilt) + 36 + 3);
      break;
    }
    case 'wall': {
      rrect(c, cx - 140, GROUND_Y - 100, 280, 100, 4, '#7d8d98');
      for (let i = 0; i < 6; i++) rrect(c, cx - 140 + i * 48, GROUND_Y - 120, 32, 24, 3, '#8d9da8');
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) c.strokeRect(cx - 140 + k * 40 + (r % 2) * 20, GROUND_Y - 100 + r * 25, 40, 25);
      ['L', 'I', 'D'].forEach((ch, i) => {
        const bx = cx - 80 + i * 80;
        line(c, bx, GROUND_Y - 150, bx, GROUND_Y - 100, '#7a4b2a', 4);
        poly(c, [[bx, GROUND_Y - 150], [bx + 36, GROUND_Y - 142 + Math.sin(t * 3 + i) * 3], [bx, GROUND_Y - 126]], ['#d9454f', '#4de1c1', '#7aa7ff'][i]);
        c.font = '800 13px system-ui'; c.fillStyle = '#1b1730'; c.textAlign = 'center'; c.fillText(ch, bx + 12, GROUND_Y - 135 + Math.sin(t * 3 + i) * 2);
      });
      break;
    }
    case 'castle': {
      const col = '#3b1d28';
      rrect(c, cx - 110, GROUND_Y - 120, 220, 120, 4, col);
      for (const tx of [cx - 130, cx + 90]) { rrect(c, tx, GROUND_Y - 170, 40, 170, 4, '#4a2535'); poly(c, [[tx - 6, GROUND_Y - 170], [tx + 46, GROUND_Y - 170], [tx + 20, GROUND_Y - 210]], '#d9454f'); }
      rrect(c, cx - 22, GROUND_Y - 70, 44, 70, 20, '#12091a');
      ell(c, cx - 70, GROUND_Y - 80, 6, 9, '#ffd24d', null); ell(c, cx + 70, GROUND_Y - 80, 6, 9, '#ffd24d', null);
      ell(c, cx, GROUND_Y - 160, 90 + Math.sin(t * 2) * 6, 40, 'rgba(255,90,60,.18)', null);
      break;
    }
    case 'runes': {
      rrect(c, cx - 70, GROUND_Y - 44, 140, 44, 6, '#4a4a90');
      rrect(c, cx - 76, GROUND_Y - 50, 152, 10, 5, '#6a6ab8');
      const y = GROUND_Y - 100 + Math.sin(t * 2) * 6;
      poly(c, [[cx, y - 30], [cx + 20, y], [cx, y + 30], [cx - 20, y]], '#7ae0ff'); ell(c, cx, y, 46, 46, 'rgba(122,224,255,.18)', null);
      c.font = '800 20px "SF Mono", monospace'; c.fillStyle = '#c9b8ff'; c.textAlign = 'center';
      ['{ }', '=>', '<T>', 'new', '#'].forEach((s, i) => { const a = t * 0.8 + i * 1.26; c.globalAlpha = 0.8; c.fillText(s, cx + Math.cos(a) * 110, GROUND_Y - 100 + Math.sin(a) * 42); });
      c.globalAlpha = 1;
      break;
    }
    case 'arena': {
      for (let i = -2; i <= 2; i++) { rrect(c, cx + i * 60 - 20, GROUND_Y - 130 + Math.abs(i) * 8, 40, 130 - Math.abs(i) * 8, 4, '#d9c79a'); }
      for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(cx + i * 30, GROUND_Y - 4, 24, Math.PI, 0); c.fillStyle = '#6a5535'; c.fill(); }
      poly(c, [[cx - 20, GROUND_Y - 150], [cx + 20, GROUND_Y - 150], [cx + 12, GROUND_Y - 120], [cx - 12, GROUND_Y - 120]], '#ffd24d'); rrect(c, cx - 4, GROUND_Y - 120, 8, 22, 2, '#e8b030'); rrect(c, cx - 16, GROUND_Y - 98, 32, 8, 3, '#e8b030');
      break;
    }
  }
  c.restore();
}

export class SceneView implements View {
  readonly fx = new Effects();
  private t = 0;
  private speak = 0;
  private hop = 0;
  private hurt = 0;
  private th: Theme;
  private clouds = Array.from({ length: 4 }, (_, i) => ({ x: i * 190 + 30, y: 30 + (i % 3) * 26, s: 0.7 + (i % 2) * 0.5 }));

  constructor(key: SceneKey) {
    this.th = THEMES[String(key)] ?? THEMES['1'];
    theme.robe = this.th.robe;
  }
  get name(): string { return this.th.name; }

  bind(): void {
    hooks.speak = (ms) => { this.speak = ms / 1000; };
    hooks.correct = (xp) => { this.hop = 1; this.fx.confetti(130, 220); if (xp) this.fx.float(130, 190, `+${xp} XP`, '#ffd24d', 22); };
    hooks.wrong = () => { this.hurt = 0.5; this.fx.float(130, 190, '✖', '#ff6a7a', 24); this.fx.shake = 0.5; };
  }

  private heroKind(): HeroKind {
    const n = session.player?.constructor.name;
    return n === 'Warrior' ? 'warrior' : n === 'Mage' ? 'mage' : n === 'Archer' ? 'archer' : 'novice';
  }

  update(dt: number): void {
    this.t += dt;
    this.speak = Math.max(0, this.speak - dt);
    this.hop = Math.max(0, this.hop - dt * 1.6);
    this.hurt = Math.max(0, this.hurt - dt);
    for (const cl of this.clouds) { cl.x += dt * 6 * cl.s; if (cl.x > W + 80) cl.x = -80; }
    this.fx.update(dt);
  }

  draw(c: Ctx): void {
    const th = this.th, t = this.t;
    c.save();
    if (this.fx.shake > 0) c.translate((Math.random() - 0.5) * 8 * this.fx.shake, 0);
    const g = c.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    c.fillStyle = g; c.fillRect(-10, 0, W + 20, GROUND_Y);
    // yıldızlar (koyu temalarda)
    if (th.night) for (let i = 0; i < 26; i++) { c.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + i); c.fillStyle = '#fff'; c.fillRect((i * 97) % W, (i * 53) % 150, 2, 2); }
    c.globalAlpha = 1;
    for (const cl of this.clouds) { c.globalAlpha = 0.55; ell(c, cl.x, cl.y, 44 * cl.s, 13 * cl.s, '#fff', null); ell(c, cl.x + 22 * cl.s, cl.y - 8 * cl.s, 26 * cl.s, 11 * cl.s, '#fff', null); }
    c.globalAlpha = 1;
    // tepeler
    c.fillStyle = th.hill;
    c.beginPath(); c.moveTo(-10, GROUND_Y); for (let x = -10; x <= W + 10; x += 20) c.lineTo(x, GROUND_Y - 38 - Math.sin(x * 0.012) * 24 - Math.cos(x * 0.03) * 10); c.lineTo(W + 10, GROUND_Y); c.fill();
    // zemin
    const gg = c.createLinearGradient(0, GROUND_Y, 0, H);
    gg.addColorStop(0, th.ground[0]); gg.addColorStop(1, th.ground[1]);
    c.fillStyle = gg; c.fillRect(-10, GROUND_Y, W + 20, H - GROUND_Y);
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-10, GROUND_Y, W + 20, 3);
    prop(c, th.prop, t);

    // 1. bölümde antrenman slime'ı
    if (th.prop === 'forge') drawSlime(c, 590, GROUND_Y + 36, { t, s: 0.9, facing: -1 });
    // kahraman ve bilge
    const jump = Math.sin(this.hop * Math.PI) * 26;
    drawHero(c, this.heroKind(), 130, GROUND_Y + 42 - jump, { t, s: 1.35, hurt: this.hurt > 0 ? this.hurt : 0 });
    drawSage(c, 510, GROUND_Y + 42, { t, s: 1.35, facing: -1, speaking: this.speak > 0, robe: th.robe });
    if (this.speak > 0) { c.font = '700 18px system-ui'; c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'center'; c.fillText('…', 500, GROUND_Y - 120 + Math.sin(t * 8) * 3); }
    this.fx.draw(c);
    // sahne adı
    c.font = '800 13px system-ui'; c.textAlign = 'left'; c.fillStyle = 'rgba(0,0,0,.35)';
    c.fillRect(10, 10, c.measureText(th.name).width + 20, 24);
    c.fillStyle = '#fff'; c.fillText(th.name, 20, 27);
    c.restore();
  }
}
