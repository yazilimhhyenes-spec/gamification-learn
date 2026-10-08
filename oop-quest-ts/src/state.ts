/**
 * Oturum durumu + basit ilerleme kaydı (.progress.json).
 * Not: Bu dosya model.ts'yi YALNIZCA tip olarak kullanır (import type), döngüsel bağımlılık yok.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Character } from './model';

export interface TrollSpec { name: string; maxHp: number; regen: number; weapon: string }

export interface Session {
  answered: Record<string, number>;   // soru id → kazanılan XP
  done: number[];                     // tamamlanan bölümler
  player?: Character;                 // 3. bölümde yaratılan kahraman
  troll?: TrollSpec;                  // 9. bölümde tasarlanan Troll
}

const FILE = path.resolve(__dirname, '..', '.progress.json');
export const session: Session = { answered: {}, done: [] };

export function loadProgress(): void {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (d && typeof d.answered === 'object') session.answered = d.answered;
    if (Array.isArray(d?.done)) session.done = d.done;
  } catch { /* ilk çalıştırma */ }
}
export function saveProgress(): void {
  try { fs.writeFileSync(FILE, JSON.stringify({ answered: session.answered, done: session.done }, null, 2)); } catch { /* yoksay */ }
}
export function resetProgress(): void {
  session.answered = {};
  session.done = [];
  session.player = undefined;
  session.troll = undefined;
  saveProgress();
}
export function markDone(n: number): void {
  if (!session.done.includes(n)) session.done.push(n);
  saveProgress();
}
