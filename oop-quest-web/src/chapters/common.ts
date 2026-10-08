import { drawHero, type HeroKind } from '../art';
import type { Character } from '../model';
import { setPlayer, session, type ClassName } from '../state';
import { h, interact, say, paint } from '../ui';

const CLASSES: { cls: ClassName; kind: HeroKind; name: string; hp: number; power: number; info: string }[] = [
  { cls: 'Warrior', kind: 'warrior', name: 'Savaşçı', hp: 120, power: 14, info: 'Zırhlı ve dayanıklı. Özel yetenek: Öfke Saldırısı' },
  { cls: 'Mage', kind: 'mage', name: 'Büyücü', hp: 80, power: 16, info: 'Düşük can, yüksek hasar. Özel yetenek: Ateş Topu (hepsine vurur)' },
  { cls: 'Archer', kind: 'archer', name: 'Okçu', hp: 95, power: 15, info: 'Dengeli. Özel yetenek: Çifte Ok' },
];

export const cleanName = (s: string, fallback: string): string =>
  s.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 16) || fallback;

/** Kahraman yaratma kartı: sınıf seç + isim yaz */
export async function createPlayer(): Promise<Character> {
  const card = h('div', 'card creator pop', '<div class="prompt">Kahramanını seç!</div>');
  const row = h('div', 'class-cards');
  let picked = 0;
  const cvs: HTMLCanvasElement[] = [];
  const els = CLASSES.map((k, i) => {
    const el = h('button', 'class-card' + (i === 0 ? ' sel' : ''));
    const cv = document.createElement('canvas'); cv.width = 120; cv.height = 130; cvs.push(cv);
    el.appendChild(cv);
    el.appendChild(h('div', 'cc-name', `${k.name} <span class="muted">${k.cls}</span>`));
    el.appendChild(h('div', 'cc-stats', `❤ ${k.hp} &nbsp; ⚔ ${k.power}`));
    el.appendChild(h('div', 'cc-info', k.info));
    el.addEventListener('click', () => { picked = i; els.forEach((x, j) => x.classList.toggle('sel', j === i)); });
    row.appendChild(el);
    return el;
  });
  card.appendChild(row);
  const input = document.createElement('input');
  input.type = 'text'; input.value = 'Kahraman'; input.maxLength = 16;
  const ok = h('button', 'btn primary', 'Maceraya başla ⚔');
  const nameRow = h('div', 'row'); nameRow.append(h('label', '', 'Adın'), input, ok);
  card.appendChild(nameRow);

  let raf = 0;
  const anim = (t: number): void => {
    cvs.forEach((cv, i) => {
      const c = cv.getContext('2d') as CanvasRenderingContext2D;
      c.clearRect(0, 0, 120, 130);
      drawHero(c, CLASSES[i].kind, 60, 118, { s: 1.35, t: t / 1000 + i, attack: els[i].classList.contains('sel') ? (Math.sin(t / 500) > 0.9 ? 0.4 : 0) : 0 });
    });
    raf = requestAnimationFrame(anim);
  };
  raf = requestAnimationFrame(anim);

  const spec = await interact<{ cls: ClassName; name: string }>(card, (done) => {
    const go = (): void => { ok.setAttribute('disabled', ''); input.disabled = true; cancelAnimationFrame(raf); done({ cls: CLASSES[picked].cls, name: cleanName(input.value, 'Kahraman') }); };
    ok.addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  });
  const player = setPlayer({ cls: spec.cls, name: spec.name, weapon: 'Fists' });
  say(paint('gray', `const player = new ${spec.cls}('${spec.name}');`));
  return player;
}

export async function ensurePlayer(): Promise<Character> {
  if (session.player) return session.player;
  say('Önce bir kahraman yaratmalısın (3. bölümü atladın):');
  return createPlayer();
}
