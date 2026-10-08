/** ⚔️ Final savaşı sahnesi: kahraman solda, düşmanlar sağda; animasyonlar model durumunu izler. */
import { drawEnemy, drawHero, ell, enemyKindOf, poly, rrect, type Ctx, type EnemyKind, type HeroKind } from './art';
import type { Character } from './model';
import { Effects, H, W, type View } from './stage';
import { sleep } from './ui';

export type Backdrop = 'meadow' | 'graveyard' | 'bridge' | 'volcano';

interface Actor {
  ref: Character;
  hero: boolean;
  kind: EnemyKind | HeroKind;
  x: number; y: number; s: number; top: number;
  shown: number;        // ekranda gösterilen can (yumuşak geçiş)
  lunge: number; hurt: number; fade: number;
}

const BACK: Record<Backdrop, { sky: [string, string]; ground: [string, string]; hill: string }> = {
  meadow: { sky: ['#8fd0ff', '#e6f6ff'], ground: ['#6fbf6a', '#4a9a52'], hill: '#8fcf8a' },
  graveyard: { sky: ['#2a2f55', '#6a6a9a'], ground: ['#4a5a56', '#33403d'], hill: '#3a4048' },
  bridge: { sky: ['#8aa2c0', '#dfe8f0'], ground: ['#8a8f98', '#656a72'], hill: '#6f8a7a' },
  volcano: { sky: ['#4a1f2f', '#ff8a4d'], ground: ['#4a2a2a', '#2a1818'], hill: '#5a2a2a' },
};

export class BattleView implements View {
  readonly fx = new Effects();
  private t = 0;
  private actors: Actor[] = [];
  private back: Backdrop;
  private heroKind: HeroKind;

  constructor(hero: Character, foes: Character[], backdrop: Backdrop) {
    this.back = backdrop;
    const hn = hero.constructor.name;
    this.heroKind = hn === 'Warrior' ? 'warrior' : hn === 'Mage' ? 'mage' : hn === 'Archer' ? 'archer' : 'novice';
    this.actors.push({ ref: hero, hero: true, kind: this.heroKind, x: 120, y: 292, s: 1.45, top: 118, shown: hero.hp, lunge: 0, hurt: 0, fade: 1 });
    const n = foes.length;
    foes.forEach((f, i) => {
      const kind = enemyKindOf(f.constructor.name);
      const big = kind === 'dragon' || kind === 'troll';
      const x = n === 1 ? 470 : 360 + (i * 210) / Math.max(1, n - 1);
      const s = kind === 'dragon' ? 1.25 : kind === 'troll' ? 1.2 : 1.4;
      this.actors.push({ ref: f, hero: false, kind, x, y: 284 + (n > 1 ? (i % 2) * 16 : 10), s, top: kind === 'dragon' ? 160 * 1 : kind === 'troll' ? 128 : 78 + (big ? 0 : 6), shown: f.hp, lunge: 0, hurt: 0, fade: 1 });
    });
  }

  private actor(i: number): Actor { return this.actors[i]; }

  /** 0 = kahraman, 1.. = düşmanlar */
  async lunge(i: number): Promise<void> {
    const a = this.actor(i);
    for (let k = 0; k <= 10; k++) { a.lunge = k / 10; await sleep(36); }
    a.lunge = 0;
  }
  popHurt(i: number, text: string, color = '#ff6a7a'): void {
    const a = this.actor(i);
    a.hurt = 0.45;
    this.fx.float(a.x, a.y - a.top * a.s * 0.6 - 10, text, color, 22);
    this.fx.sparks(a.x, a.y - a.top * a.s * 0.4, '#fff3b0');
    if (a.hero) this.fx.shake = 0.35;
  }
  popHeal(i: number, text: string): void {
    const a = this.actor(i);
    this.fx.float(a.x, a.y - a.top * a.s * 0.6 - 10, text, '#4de1c1', 22);
    this.fx.sparks(a.x, a.y - a.top * a.s * 0.5, '#7dffcf', 18);
  }
  note(i: number, text: string, color = '#ffd24d'): void {
    const a = this.actor(i);
    this.fx.float(a.x, a.y - a.top * a.s - 8, text, color, 16);
  }
  victory(): void { this.fx.confetti(W / 2, 140, 60); }

  update(dt: number): void {
    this.t += dt;
    this.fx.update(dt);
    for (const a of this.actors) {
      a.shown += (a.ref.hp - a.shown) * Math.min(1, dt * 7);
      a.hurt = Math.max(0, a.hurt - dt);
      if (!a.ref.isAlive) a.fade = Math.max(0, a.fade - dt * 1.4);
    }
  }

  draw(c: Ctx): void {
    const t = this.t, th = BACK[this.back];
    c.save();
    if (this.fx.shake > 0) c.translate((Math.random() - 0.5) * 9 * this.fx.shake, (Math.random() - 0.5) * 5 * this.fx.shake);
    const g = c.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    c.fillStyle = g; c.fillRect(-10, -10, W + 20, 280);
    if (this.back === 'volcano') {
      poly(c, [[360, 262], [440, 70], [520, 262]], '#3a1a1f'); ell(c, 440, 78, 22, 8, '#ff7a3d', null);
      for (let i = 0; i < 6; i++) { c.globalAlpha = 0.6; ell(c, 440 + Math.sin(t * 2 + i) * 20, 70 - ((t * 40 + i * 25) % 90), 6 - i * 0.6, 6 - i * 0.6, '#ffb13d', null); }
      c.globalAlpha = 1;
    }
    if (this.back === 'graveyard') { for (let i = 0; i < 20; i++) { c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); c.fillStyle = '#fff'; c.fillRect((i * 83) % W, (i * 41) % 120, 2, 2); } c.globalAlpha = 1; ell(c, 540, 60, 26, 26, '#f3ead2', null); }
    c.fillStyle = th.hill;
    c.beginPath(); c.moveTo(-10, 270); for (let x = -10; x <= W + 10; x += 20) c.lineTo(x, 238 - Math.sin(x * 0.015 + 1) * 22 - Math.cos(x * 0.04) * 8); c.lineTo(W + 10, 270); c.fill();
    const gg = c.createLinearGradient(0, 262, 0, H);
    gg.addColorStop(0, th.ground[0]); gg.addColorStop(1, th.ground[1]);
    c.fillStyle = gg; c.fillRect(-10, 262, W + 20, H - 262);
    if (this.back === 'graveyard') for (const gx of [220, 300, 590]) { rrect(c, gx, 236, 22, 34, 10, '#7a8890'); }
    if (this.back === 'bridge') { rrect(c, -10, 262, W + 20, 14, 2, '#7a5a3a'); }

    for (const a of this.actors) {
      if (a.fade <= 0.02) continue;
      const o = { s: a.s, t, facing: (a.hero ? 1 : -1) as 1 | -1, attack: a.lunge, hurt: a.hurt, alpha: a.fade };
      if (a.hero) drawHero(c, a.kind as HeroKind, a.x, a.y, o);
      else drawEnemy(c, a.kind as EnemyKind, a.x, a.y, o);
      // can çubuğu
      if (a.ref.isAlive) {
        const bw = a.hero ? 96 : 76, bx = a.x - bw / 2, by = a.y - a.top * a.s - 30;
        const r = Math.max(0, a.shown / a.ref.maxHp);
        rrect(c, bx - 2, by - 2, bw + 4, 12, 6, 'rgba(27,23,48,.85)', null);
        rrect(c, bx, by, Math.max(2, bw * r), 8, 4, r > 0.5 ? '#43d17a' : r > 0.25 ? '#f5c84c' : '#ff5a6e', null);
        c.font = '800 11px system-ui'; c.textAlign = 'center';
        c.lineWidth = 3; c.strokeStyle = '#1b1730'; c.strokeText(a.ref.name, a.x, by - 6);
        c.fillStyle = '#fff'; c.fillText(a.ref.name, a.x, by - 6);
        if (a.hero) {
          for (let i = 0; i < 3; i++) ell(c, a.x - 14 + i * 14, by + 18, 4.5, 4.5, i < a.ref.energy ? '#7aa7ff' : 'rgba(255,255,255,.2)', '#1b1730', 1.5);
        }
      }
    }
    this.fx.draw(c);
    c.restore();
  }
}
