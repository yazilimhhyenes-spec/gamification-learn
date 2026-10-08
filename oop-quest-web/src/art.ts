/**
 * 🎨 Tüm görseller canvas ile kodla çizilir (dış resim dosyası yok).
 * Her çizim fonksiyonu karakterin AYAK noktasını (x, y) alır ve SAĞA bakacak biçimde çizer;
 * sola baktırmak için facing: -1 verilir.
 */
export type Ctx = CanvasRenderingContext2D;
export type HeroKind = 'warrior' | 'mage' | 'archer' | 'novice';
export type EnemyKind = 'goblin' | 'skeleton' | 'dragon' | 'troll' | 'slime';

export const OUT = '#1b1730';

export interface DrawOpts {
  s?: number;          // ölçek
  t?: number;          // zaman (sn)
  facing?: 1 | -1;
  walk?: boolean;
  attack?: number;     // 0..1 saldırı ilerlemesi
  hurt?: number;       // 0..1 hasar yeme
  alpha?: number;
  speaking?: boolean;
}

/* ───────────── Küçük çizim yardımcıları ───────────── */
export function ell(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, stroke: string | null = OUT, lw = 2): void {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}
export function rrect(c: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string | null = OUT, lw = 2): void {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill; c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}
export function poly(c: Ctx, pts: [number, number][], fill: string, stroke: string | null = OUT, lw = 2): void {
  c.beginPath();
  pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
  c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.lineWidth = lw; c.lineJoin = 'round'; c.strokeStyle = stroke; c.stroke(); }
}
export function line(c: Ctx, x1: number, y1: number, x2: number, y2: number, col: string, lw = 3): void {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.stroke();
}
function begin(c: Ctx, x: number, y: number, o: DrawOpts): void {
  const s = o.s ?? 1;
  c.save();
  c.translate(x, y);
  c.scale(s * (o.facing ?? 1), s);
  let a = o.alpha ?? 1;
  if (o.hurt && o.hurt > 0) a *= Math.floor((o.t ?? 0) * 24) % 2 ? 0.45 : 1;
  c.globalAlpha = a;
  if (o.hurt && o.hurt > 0) c.translate(Math.sin((o.t ?? 0) * 60) * 4 * o.hurt, 0);
  if (o.attack && o.attack > 0) c.translate(Math.sin(o.attack * Math.PI) * 34, 0);   // öne atılma
}
function shadow(c: Ctx, rx: number): void { ell(c, 0, 1, rx, rx * 0.28, 'rgba(0,0,0,.28)', null); }

/* ───────────── KAHRAMANLAR ───────────── */
const SKIN = '#f6cfa6';

export function drawHero(c: Ctx, kind: HeroKind, x: number, y: number, o: DrawOpts = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 20);
  const bob = o.walk ? Math.abs(Math.sin(t * 11)) * 3 : Math.sin(t * 2.6) * 1.4;
  const step = o.walk ? Math.sin(t * 11) * 5 : 0;
  const body = { warrior: '#5b7fd1', mage: '#8e5bd6', archer: '#4fa86a', novice: '#b79b72' }[kind];
  const trim = { warrior: '#c9d3ea', mage: '#f5c84c', archer: '#8b5a2b', novice: '#8a734f' }[kind];

  // bacaklar
  rrect(c, -10 + step, -20, 8, 20, 3, '#3b3354');
  rrect(c, 2 - step, -20, 8, 20, 3, '#3b3354');
  c.translate(0, -bob);
  // gövde
  if (kind === 'mage') poly(c, [[-14, -18], [14, -18], [10, -44], [-10, -44]], body);
  else rrect(c, -13, -44, 26, 28, 6, body);
  rrect(c, -13, -30, 26, 5, 2, trim, null);                       // kemer
  rrect(c, -3, -31, 6, 7, 1, '#f5c84c', OUT, 1.5);               // toka
  // kol
  ell(c, -14, -34, 5, 8, body);
  ell(c, 15, -34, 5, 8, body);
  ell(c, 17, -27, 4, 4, SKIN);
  // kafa
  ell(c, 0, -54, 13, 13, SKIN);
  ell(c, -4, -54, 2.2, 2.8, OUT, null); ell(c, 5, -54, 2.2, 2.8, OUT, null);
  c.beginPath(); c.arc(1, -48.5, 3, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
  ell(c, -8, -50, 3, 2, 'rgba(255,120,120,.45)', null); ell(c, 9, -50, 3, 2, 'rgba(255,120,120,.45)', null);

  const swing = o.attack ?? 0;
  if (kind === 'warrior') {
    // miğfer
    c.beginPath(); c.arc(0, -56, 14, Math.PI, 0); c.closePath(); c.fillStyle = '#9fb0cf'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    rrect(c, -15, -58, 30, 5, 2, '#7d8fb3');
    poly(c, [[-2, -70], [4, -70], [10, -80], [-2, -74]], '#d94b4b');
    // kalkan
    poly(c, [[-26, -40], [-12, -40], [-12, -22], [-19, -16], [-26, -22]], '#d94b4b');
    line(c, -19, -38, -19, -20, '#f5c84c', 2);
    // kılıç
    c.save(); c.translate(19, -30); c.rotate(-0.9 + swing * 2.2);
    rrect(c, -2.5, -34, 5, 32, 1.5, '#e6edf7'); poly(c, [[-2.5, -34], [2.5, -34], [0, -40]], '#e6edf7');
    rrect(c, -8, -4, 16, 4, 2, '#f5c84c'); rrect(c, -2, 0, 4, 9, 2, '#7a4b2a');
    c.restore();
  } else if (kind === 'mage') {
    // şapka
    ell(c, 0, -62, 19, 5, '#6b3fb5');
    poly(c, [[-12, -62], [12, -62], [3, -92], [-3, -92]], '#7d4bcf');
    poly(c, [[-12, -62], [12, -62], [10, -67], [-10, -67]], '#f5c84c', OUT, 1.5);
    ell(c, 3, -80, 3, 3, '#f5c84c', null);
    // asa
    const glow = 0.5 + 0.5 * Math.sin(t * 5) + swing;
    line(c, 21, -8, 21, -62, '#7a4b2a', 4);
    ell(c, 21, -66, 7 + glow * 2, 7 + glow * 2, `rgba(255,170,60,${0.35 + glow * 0.25})`, null);
    ell(c, 21, -66, 5, 5, '#ff7a3d');
  } else if (kind === 'archer') {
    // kapüşon
    c.beginPath(); c.arc(0, -55, 15, Math.PI * 0.95, Math.PI * 2.05); c.closePath(); c.fillStyle = '#3d8c57'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    poly(c, [[8, -66], [18, -78], [12, -64]], '#e86a5c');
    // yay
    c.beginPath(); c.arc(22 + swing * 3, -34, 22, -Math.PI * 0.42, Math.PI * 0.42); c.lineWidth = 4; c.strokeStyle = '#8b5a2b'; c.stroke();
    line(c, 22 + Math.cos(-Math.PI * 0.42) * 22 + swing * 3, -34 + Math.sin(-Math.PI * 0.42) * 22, 22 + Math.cos(Math.PI * 0.42) * 22 + swing * 3, -34 + Math.sin(Math.PI * 0.42) * 22, '#f3ead2', 1.5);
    if (swing > 0 && swing < 0.6) line(c, 22, -34, 50, -34, '#e6edf7', 2.5);
    rrect(c, -20, -36, 7, 20, 3, '#8b5a2b');                      // sadak
  } else {
    // çaylak: kahverengi saç
    c.beginPath(); c.arc(0, -57, 13.5, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fillStyle = '#6b4a2b'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    line(c, 21, -14, 21, -44, '#8b5a2b', 4);                      // sopa
  }
  c.restore();
}

/* ───────────── BİLGE (NPC) ───────────── */
export function drawSage(c: Ctx, x: number, y: number, o: DrawOpts & { robe?: string } = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 24);
  const robe = o.robe ?? '#2fb8a6';
  const bob = Math.sin(t * 2.2) * 1.6 + (o.speaking ? Math.abs(Math.sin(t * 14)) * 2 : 0);
  c.translate(0, -bob);
  poly(c, [[-22, 0], [22, 0], [14, -48], [-14, -48]], robe);
  poly(c, [[-22, 0], [-14, 0], [-6, -48], [-14, -48]], 'rgba(0,0,0,.12)', null);
  rrect(c, -14, -32, 28, 5, 2, '#f5c84c', null);
  ell(c, 0, -58, 13, 13, SKIN);
  // sakal
  poly(c, [[-12, -56], [12, -56], [8, -34], [0, -26], [-8, -34]], '#f1f1f6');
  ell(c, -4.5, -60, 2, 2.6, OUT, null); ell(c, 5, -60, 2, 2.6, OUT, null);
  line(c, -8, -64, -2, -63, '#f1f1f6', 3); line(c, 2, -63, 9, -64, '#f1f1f6', 3);
  if (o.speaking) ell(c, 0, -52, 3, 2 + Math.abs(Math.sin(t * 14)) * 2, '#5a2d2d', null);
  // şapka
  ell(c, 0, -69, 20, 5, robe);
  poly(c, [[-13, -69], [13, -69], [4, -100 - Math.sin(t * 3) * 2], [-4, -98]], robe);
  ell(c, 4, -85, 3, 3, '#f5c84c', null);
  // kitap
  c.save(); c.translate(-22, -26 - Math.sin(t * 2.2) * 2); c.rotate(-0.25);
  rrect(c, -9, -12, 18, 22, 2, '#a8472f'); rrect(c, -7, -10, 14, 18, 1, '#f3ead2', OUT, 1);
  line(c, -4, -5, 4, -5, '#9a8c70', 1.5); line(c, -4, 0, 4, 0, '#9a8c70', 1.5);
  c.restore();
  c.restore();
}

/* ───────────── DÜŞMANLAR (varsayılan: sola bakar → facing -1 ver) ───────────── */
export function drawGoblin(c: Ctx, x: number, y: number, o: DrawOpts = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 20);
  const bob = Math.abs(Math.sin(t * 4.5)) * 2.5;
  rrect(c, -9, -16, 7, 16, 3, '#4f3b2a'); rrect(c, 3, -16, 7, 16, 3, '#4f3b2a');
  c.translate(0, -bob);
  rrect(c, -13, -38, 26, 24, 6, '#8a6a3b');
  rrect(c, -13, -26, 26, 4, 2, '#5b4326', null);
  ell(c, 16, -26, 4, 4, '#6bbf59');
  // sopa
  c.save(); c.translate(18, -26); c.rotate(-0.5 + (o.attack ?? 0) * 2);
  rrect(c, -3, -30, 7, 32, 3, '#7a4b2a'); ell(c, 0.5, -32, 7, 9, '#8b5a2b');
  c.restore();
  // kulaklar
  poly(c, [[-12, -52], [-30, -58], [-14, -44]], '#6bbf59'); poly(c, [[12, -52], [30, -58], [14, -44]], '#6bbf59');
  ell(c, 0, -50, 15, 14, '#6bbf59');
  ell(c, -5.5, -53, 4.5, 5, '#ffe45c'); ell(c, 6, -53, 4.5, 5, '#ffe45c');
  ell(c, -5, -53, 1.8, 3, OUT, null); ell(c, 6.5, -53, 1.8, 3, OUT, null);
  poly(c, [[-1, -50], [3, -50], [1, -45]], '#4b9a3c', null);
  c.beginPath(); c.moveTo(-6, -43); c.quadraticCurveTo(0, -38, 7, -43); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  poly(c, [[-4, -42], [-2, -42], [-3, -38]], '#fff', null); poly(c, [[3, -42], [5, -42], [4, -38]], '#fff', null);
  c.restore();
}

export function drawSkeleton(c: Ctx, x: number, y: number, o: DrawOpts = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 20);
  const bone = '#ece6d2';
  const bob = Math.sin(t * 3) * 1.8;
  line(c, -6, -18, -6, 0, bone, 5); line(c, 7, -18, 7, 0, bone, 5);
  c.translate(0, -bob);
  // kaburga kafesi
  rrect(c, -13, -44, 26, 28, 8, '#2b2540', OUT);
  line(c, 0, -44, 0, -18, bone, 4);
  for (let i = 0; i < 4; i++) { line(c, -11, -41 + i * 7, 11, -41 + i * 7, bone, 3.2); }
  // kollar
  line(c, -13, -42, -22, -26, bone, 4);
  line(c, 13, -42, 21, -28, bone, 4);
  // kılıç
  c.save(); c.translate(21, -28); c.rotate(-0.7 + (o.attack ?? 0) * 2.2);
  rrect(c, -2.5, -32, 5, 30, 1.5, '#b9a98a'); rrect(c, -7, -4, 14, 4, 2, '#7a6a52'); rrect(c, -2, 0, 4, 8, 2, '#5a4a38');
  c.restore();
  // kafatası
  ell(c, 0, -56, 14, 13, bone);
  rrect(c, -8, -48, 16, 8, 3, bone);
  ell(c, -5.5, -57, 4, 4.6, '#171226', null); ell(c, 6, -57, 4, 4.6, '#171226', null);
  ell(c, -5.5, -57, 1.4, 1.4, '#ff4d4d', null); ell(c, 6, -57, 1.4, 1.4, '#ff4d4d', null);
  poly(c, [[-1.5, -52], [2, -52], [0.4, -48]], '#171226', null);
  for (let i = -2; i <= 2; i++) line(c, i * 3, -45, i * 3, -41, OUT, 1.4);
  c.restore();
}

export function drawDragon(c: Ctx, x: number, y: number, o: DrawOpts = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 58);
  const flap = Math.sin(t * 4) * 10;
  // kanatlar
  poly(c, [[-10, -70], [-48, -118 - flap], [-62, -78], [-30, -66]], '#a8323e');
  poly(c, [[6, -72], [34, -122 - flap], [54, -82], [26, -68]], '#c23b4a');
  // kuyruk
  c.beginPath(); c.moveTo(-34, -34); c.quadraticCurveTo(-76, -28, -70, -62 + Math.sin(t * 3) * 6); c.lineWidth = 12; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke();
  c.beginPath(); c.moveTo(-34, -34); c.quadraticCurveTo(-76, -28, -70, -62 + Math.sin(t * 3) * 6); c.lineWidth = 8; c.strokeStyle = '#d9454f'; c.stroke();
  // bacaklar
  rrect(c, -22, -22, 14, 22, 5, '#b83a46'); rrect(c, 8, -22, 14, 22, 5, '#b83a46');
  // gövde
  ell(c, 0, -46, 44, 30, '#d9454f');
  ell(c, 8, -38, 28, 20, '#f2a65a', null);
  for (let i = 0; i < 4; i++) line(c, -2 + i * 9, -50 + i * 2, -2 + i * 9, -28 + i * 2, 'rgba(160,80,30,.5)', 2);
  // sırt dikenleri
  for (let i = 0; i < 5; i++) poly(c, [[-30 + i * 14, -72 + Math.abs(i - 2) * 4], [-24 + i * 14, -84 + Math.abs(i - 2) * 4], [-18 + i * 14, -72 + Math.abs(i - 2) * 4]], '#f2c84c', OUT, 1.5);
  // boyun + kafa
  c.beginPath(); c.moveTo(30, -56); c.quadraticCurveTo(52, -78, 46, -96); c.lineWidth = 20; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke();
  c.beginPath(); c.moveTo(30, -56); c.quadraticCurveTo(52, -78, 46, -96); c.lineWidth = 15; c.strokeStyle = '#d9454f'; c.stroke();
  ell(c, 52, -102, 17, 13, '#d9454f');
  rrect(c, 56, -100, 24 + (o.attack ?? 0) * 6, 11, 5, '#c23b4a');
  poly(c, [[44, -112], [38, -130], [52, -114]], '#f3ead2'); poly(c, [[54, -114], [54, -132], [62, -114]], '#f3ead2');
  ell(c, 54, -106, 4.5, 4.5, '#ffe45c'); ell(c, 55.5, -106, 1.6, 3.6, OUT, null);
  ell(c, 76, -98, 1.5, 1.5, OUT, null);
  // ateş
  const a = o.attack ?? 0;
  if (a > 0.15 && a < 0.95) {
    const k = Math.sin(((a - 0.15) / 0.8) * Math.PI);
    for (let i = 0; i < 5; i++) {
      const r = (24 + i * 16) * k;
      ell(c, 84 + i * 20 * k, -94 + Math.sin(t * 20 + i) * 4, r * 0.8, r * 0.45, ['#ffd24d', '#ff9b3d', '#ff6a3d', '#ff4a3d', '#c23b4a'][i] + 'cc', null);
    }
  }
  c.restore();
}

export function drawTroll(c: Ctx, x: number, y: number, o: DrawOpts = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 38);
  const bob = Math.sin(t * 2.2) * 2;
  const skin = '#7d9b6e';
  rrect(c, -22, -26, 16, 26, 6, '#5a7050'); rrect(c, 6, -26, 16, 26, 6, '#5a7050');
  c.translate(0, -bob);
  ell(c, 0, -58, 32, 36, skin);
  ell(c, 0, -48, 20, 22, '#a3bd93', null);
  rrect(c, -30, -50, 60, 10, 4, '#6b4a2b', null);                // kemer
  // kollar
  ell(c, -32, -62, 10, 18, skin); ell(c, 32, -62, 10, 18, skin);
  // sopa
  c.save(); c.translate(34, -50); c.rotate(-0.6 + (o.attack ?? 0) * 2.4);
  rrect(c, -4, -62, 9, 62, 4, '#7a4b2a'); ell(c, 0.5, -66, 13, 17, '#8b5a2b');
  for (let i = 0; i < 4; i++) ell(c, -5 + (i % 2) * 11, -72 + Math.floor(i / 2) * 12, 2.5, 2.5, '#c9c9d4', null);
  c.restore();
  // kafa
  ell(c, 0, -96, 17, 15, skin);
  ell(c, -6, -99, 4, 4.4, '#ffe45c'); ell(c, 7, -99, 4, 4.4, '#ffe45c');
  ell(c, -5.5, -99, 1.6, 2.8, OUT, null); ell(c, 7.5, -99, 1.6, 2.8, OUT, null);
  line(c, -11, -105, -2, -102, OUT, 2.4); line(c, 12, -105, 3, -102, OUT, 2.4);
  ell(c, 0, -90, 4, 3, '#678558', null);
  poly(c, [[-9, -88], [-5, -88], [-7, -78]], '#f3ead2'); poly(c, [[7, -88], [11, -88], [9, -78]], '#f3ead2');
  c.restore();
}

export function drawSlime(c: Ctx, x: number, y: number, o: DrawOpts = {}): void {
  const t = o.t ?? 0;
  begin(c, x, y, o);
  shadow(c, 22);
  const sq = 1 + Math.sin(t * 4) * 0.08;
  c.scale(1 / sq, sq);
  c.beginPath();
  c.moveTo(-22, 0); c.bezierCurveTo(-26, -26, -12, -42, 0, -42); c.bezierCurveTo(14, -42, 26, -26, 22, 0); c.closePath();
  c.fillStyle = '#58d6a8'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  ell(c, -9, -30, 6, 4, 'rgba(255,255,255,.55)', null);
  ell(c, -6, -18, 3, 4, OUT, null); ell(c, 7, -18, 3, 4, OUT, null);
  c.beginPath(); c.arc(1, -11, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
  c.restore();
}

export function drawEnemy(c: Ctx, kind: EnemyKind, x: number, y: number, o: DrawOpts = {}): void {
  ({ goblin: drawGoblin, skeleton: drawSkeleton, dragon: drawDragon, troll: drawTroll, slime: drawSlime })[kind](c, x, y, o);
}

/** Sınıf adından (Goblin, Skeleton…) çizim türü */
export function enemyKindOf(className: string): EnemyKind {
  const k = className.toLowerCase();
  return (['goblin', 'skeleton', 'dragon', 'troll', 'slime'] as const).find((e) => e === k) ?? 'slime';
}

/* ───────────── Kısa küçük ikonlar ───────────── */
export function drawHeart(c: Ctx, x: number, y: number, r: number, fill = '#ff5a6e'): void {
  c.save(); c.translate(x, y); c.scale(r / 10, r / 10);
  c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-14, -2, -8, -12, 0, -5); c.bezierCurveTo(8, -12, 14, -2, 0, 8);
  c.fillStyle = fill; c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
  c.restore();
}
export function drawStar(c: Ctx, x: number, y: number, r: number, fill = '#ffd24d'): void {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
}
