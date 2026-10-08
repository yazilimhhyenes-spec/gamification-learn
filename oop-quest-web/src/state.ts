/** Oturum durumu + localStorage ilerleme kaydı. */
import { Archer, Bow, Character, Fists, Mage, Staff, Sword, Warrior, type Weapon } from './model';

export interface TrollSpec { name: string; maxHp: number; regen: number; weapon: string }
export type ClassName = 'Warrior' | 'Mage' | 'Archer';
export interface PlayerSpec { cls: ClassName; name: string; weapon: string }

export interface Session {
  answered: Record<string, number>;   // soru id → kazanılan XP
  done: number[];                     // tamamlanan bölümler (12 = sınav)
  player?: Character;
  playerSpec?: PlayerSpec;
  troll?: TrollSpec;
}

const KEY = 'oop-quest-web-v1';
export const session: Session = { answered: {}, done: [] };

export const WEAPONS: Record<string, () => Weapon> = {
  Fists: () => new Fists(), Sword: () => new Sword(), Bow: () => new Bow(), Staff: () => new Staff(),
};
export const CLASSES: Record<ClassName, (n: string) => Character> = {
  Warrior: (n) => new Warrior(n), Mage: (n) => new Mage(n), Archer: (n) => new Archer(n),
};

export function buildPlayer(spec: PlayerSpec): Character {
  const p = CLASSES[spec.cls](spec.name);
  p.weapon = (WEAPONS[spec.weapon] ?? WEAPONS.Fists)();
  return p;
}
export function setPlayer(spec: PlayerSpec): Character {
  session.playerSpec = spec;
  session.player = buildPlayer(spec);
  saveProgress();
  return session.player;
}

export function loadProgress(): void {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!d) return;
    if (d.answered && typeof d.answered === 'object') session.answered = d.answered;
    if (Array.isArray(d.done)) session.done = d.done;
    if (d.troll) session.troll = d.troll;
    if (d.playerSpec) { session.playerSpec = d.playerSpec; session.player = buildPlayer(d.playerSpec); }
  } catch { /* ilk çalıştırma */ }
}
export function saveProgress(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ answered: session.answered, done: session.done, troll: session.troll, playerSpec: session.playerSpec }));
  } catch { /* depolama kapalı olabilir */ }
}
export function resetProgress(): void {
  session.answered = {}; session.done = []; session.player = undefined; session.playerSpec = undefined; session.troll = undefined;
  saveProgress();
}
export function markDone(n: number): void {
  if (!session.done.includes(n)) session.done.push(n);
  saveProgress();
}
export const totalXp = (): number => Object.values(session.answered).reduce((a, v) => a + v, 0);
export const levelOf = (xp: number): number => Math.floor(xp / 12) + 1;
