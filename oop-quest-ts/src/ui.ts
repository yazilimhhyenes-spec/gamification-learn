/**
 * Konsol arayüz yardımcıları: renkler, girdi kuyruğu, menüler, sınav sistemi.
 * (OOP ile ilgisi yok; oyunun "tesisatı".)
 */
import * as readline from 'node:readline';
import { session, saveProgress } from './state';

export const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
} as const;
export type Color = Exclude<keyof typeof C, 'reset'>;

export const paint = (c: Color, t: string): string => C[c] + t + C.reset;
export const FAST = !!process.env.FAST;
export const sleep = (ms: number): Promise<void> => (FAST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
export const say = (t = ''): void => console.log(t);
export const rule = (ch = '─'): void => say(paint('gray', ch.repeat(64)));
export const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

/* ── Girdi: satır kuyruğu (terminal ve pipe ile güvenilir) ── */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const queue: string[] = [];
let waiter: ((v: string | null) => void) | null = null;
let closed = false;

rl.on('line', (l) => {
  if (waiter) { const w = waiter; waiter = null; w(l); } else queue.push(l);
});
rl.on('close', () => { closed = true; if (waiter) waiter(null); });
rl.on('SIGINT', () => bye());

export function bye(): never {
  say(paint('yellow', '\n\nGörüşürüz, kahraman! 👋 (ilerlemen kaydedildi)'));
  saveProgress();
  process.exit(0);
}
export const closeInput = (): void => rl.close();

export function ask(q: string): Promise<string> {
  process.stdout.write(q);
  return new Promise((resolve) => {
    const done = (v: string | null): void => (v === null ? bye() : resolve(v.trim()));
    if (queue.length) done(queue.shift() as string);
    else if (closed) done(null);
    else waiter = done;
  });
}
export const pause = (msg = 'Devam etmek için Enter…'): Promise<string> => ask(paint('gray', `\n  ⏎  ${msg} `));

export async function choose(prompt: string, options: string[]): Promise<number> {
  if (prompt) say(prompt);
  options.forEach((o, i) => say(`   ${paint('yellow', `${i + 1})`)} ${o}`));
  for (;;) {
    const n = parseInt(await ask(paint('cyan', '  > ')), 10);
    if (n >= 1 && n <= options.length) return n - 1;
    say(paint('red', `  1 ile ${options.length} arasında bir sayı gir.`));
  }
}

export async function askNumber(prompt: string, min: number, max: number, def: number): Promise<number> {
  for (;;) {
    const raw = await ask(paint('cyan', `${prompt} (${min}-${max}) [${def}]: `));
    if (raw === '') return def;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= min && n <= max) return n;
    say(paint('red', `  ${min} ile ${max} arasında tam sayı gir.`));
  }
}

/* ── Başlıklar, öğretici metin ── */
export function title(text: string): void {
  say();
  say(paint('magenta', '╔' + '═'.repeat(62) + '╗'));
  say(paint('magenta', '║ ') + paint('bold', text.padEnd(61)) + paint('magenta', '║'));
  say(paint('magenta', '╚' + '═'.repeat(62) + '╝'));
}
export async function teach(...paragraphs: string[]): Promise<void> {
  for (const p of paragraphs) {
    say(paint('green', '  📘 ') + p);
    await sleep(200);
  }
}
export const tip = (t: string): void => say(paint('yellow', '  💡 ') + t);
export const warn = (t: string): void => say(paint('red', '  ⚠️  ') + t);
export const em = (t: string): string => paint('yellow', t);
export const b = (t: string): string => paint('bold', t);
export const code = (t: string): string => paint('cyan', t);

/* ── Kod gösterimi (TypeScript sözdizimi renklendirme) ── */
function highlight(line: string): string {
  const i = line.indexOf('//');
  let body = i >= 0 ? line.slice(0, i) : line;
  const comment = i >= 0 ? paint('gray', line.slice(i)) : '';
  body = body
    .replace(/\b(class|abstract|interface|implements|extends|super|constructor|new|return|get|set|this|const|let|if|else|for|of|throw|static|private|protected|public|readonly|override|instanceof|as|is|type|function|export|import|from)\b/g, (m) => paint('cyan', m))
    .replace(/\b(number|string|boolean|void|unknown|any|never)\b/g, (m) => paint('blue', m))
    .replace(/#\w+/g, (m) => paint('magenta', m))
    .replace(/'[^']*'/g, (m) => paint('green', m));
  return body + comment;
}
export function dedent(src: string): string {
  const ls = src.replace(/\s+$/, '').split('\n');
  const indents = ls.filter((l) => l.trim()).map((l) => (l.match(/^ */) as RegExpMatchArray)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return ls.map((l) => l.slice(cut)).join('\n');
}
export function showCode(src: string, label = 'TypeScript'): void {
  const out = dedent(src).split('\n');
  say(paint('gray', `  ┌─ ${label} ${'─'.repeat(Math.max(0, 56 - label.length))}`));
  out.forEach((l) => say(paint('gray', '  │ ') + highlight(l)));
  say(paint('gray', '  └' + '─'.repeat(60)));
}

export const bar = (hp: number, max: number, w = 16): string => {
  const f = Math.max(0, Math.min(w, Math.round((hp / max) * w)));
  const color: Color = hp / max > 0.5 ? 'green' : hp / max > 0.25 ? 'yellow' : 'red';
  return paint(color, '█'.repeat(f)) + paint('gray', '░'.repeat(w - f));
};

/* ── Sınav sistemi: her soru tek sefer XP verir ── */
export const shuffle = <T>(a: readonly T[]): T[] =>
  a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

export async function quiz(id: string, question: string, correct: string, wrongs: string[], explain: string): Promise<void> {
  const opts = shuffle([correct, ...wrongs]);
  const answer = opts.indexOf(correct);
  const already = id in session.answered;
  say();
  say(paint('bold', '  ❓ ' + question));
  let tries = 0;
  for (;;) {
    const n = await choose('', opts);
    tries++;
    if (n === answer) {
      if (already) {
        say(paint('green', '  ✔ Doğru!') + paint('gray', '  (bu soruyu daha önce çözdün, tekrar XP yok)'));
      } else {
        const gain = tries === 1 ? 3 : 1;
        session.answered[id] = gain;
        saveProgress();
        say(paint('green', `  ✔ Doğru! +${gain} XP`) + paint('gray', `  (toplam ${totalXp()})`));
      }
      say(paint('gray', '    ' + explain));
      return;
    }
    say(paint('red', '  ✖ Olmadı, bir daha düşün…'));
  }
}
export const totalXp = (): number => Object.values(session.answered).reduce((a, v) => a + v, 0);
