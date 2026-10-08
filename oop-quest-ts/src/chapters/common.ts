import { Archer, Character, Mage, Warrior } from '../model';
import { session } from '../state';
import { ask, choose, say, paint } from '../ui';

const CLASSES = [
  { name: 'Savaşçı (Warrior)', make: (n: string): Character => new Warrior(n), code: 'Warrior', info: '120 can, zırhlı, Öfke Saldırısı' },
  { name: 'Büyücü  (Mage)   ', make: (n: string): Character => new Mage(n), code: 'Mage', info: '80 can, Ateş Topu (hepsine vurur)' },
  { name: 'Okçu    (Archer) ', make: (n: string): Character => new Archer(n), code: 'Archer', info: '95 can, Çifte Ok' },
];

export const cleanName = (s: string, fallback: string): string =>
  s.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 16) || fallback;

/** Oyuncuya sınıf seçtirir ve kahramanı yaratır */
export async function createPlayer(): Promise<Character> {
  const i = await choose('  Hangi kahraman?', CLASSES.map((c) => `${c.name} – ${c.info}`));
  const name = cleanName(await ask(paint('cyan', '  Adın [Kahraman]: ')), 'Kahraman');
  const player = CLASSES[i].make(name);
  say();
  say(paint('gray', '  ▶ ') + paint('cyan', `const player = new ${CLASSES[i].code}('${name}');`));
  session.player = player;
  return player;
}

export async function ensurePlayer(): Promise<Character> {
  if (session.player) return session.player;
  say(paint('yellow', '\n  Önce bir kahraman yaratmalısın (3. bölümü atladın):'));
  return createPlayer();
}
