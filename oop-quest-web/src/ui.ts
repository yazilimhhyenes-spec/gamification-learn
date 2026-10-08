/**
 * 📜 Öğretici akışı (feed): konuşma kartları, kod kartları, sınav, seçim, soru…
 * Bölüm betikleri `await teach(...)`, `await quiz(...)` gibi çağırır; ekrana kartlar eklenir.
 */
import { drawSage } from './art';
import { esc, highlight } from './highlight';
import type { View } from './stage';
import { saveProgress, session, totalXp } from './state';

export class ChapterAbort extends Error {}

let feed: HTMLElement;
let pending: Array<() => void> = [];

/** Sahne görünümüne tepki bildiren kancalar (scene.ts bağlar) */
export const hooks = {
  speak: (_ms: number): void => {},
  correct: (_xp: number): void => {},
  wrong: (): void => {},
  xp: (): void => {},
  title: (_t: string): void => {},
  setView: (_v: View | null): void => {},
};
export const theme = { robe: '#2fb8a6' };

const FAST = new URLSearchParams(location.search).has('fast');
export const sleep = (ms: number): Promise<void> => (FAST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

export function mountFeed(el: HTMLElement): void { feed = el; }
export function clearFeed(): void { feed.innerHTML = ''; feed.scrollTop = 0; }
export function cancelPending(): void { pending.splice(0).forEach((f) => f()); }

/* ───────────── HTML yardımcıları (renk fonksiyonlarının web karşılığı) ───────────── */
export const em = (t: string): string => `<em class="hl">${t}</em>`;
export const b = (t: string): string => `<strong>${t}</strong>`;
export const code = (t: string): string => `<code>${esc(t)}</code>`;
export type Color = 'gray' | 'green' | 'red' | 'yellow' | 'cyan';
export const paint = (c: Color, t: string): string => `<span class="c-${c}">${esc(t)}</span>`;

export function h(tag: string, cls = '', html = ''): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
export function append(el: HTMLElement): HTMLElement {
  feed.appendChild(el);
  requestAnimationFrame(() => feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' }));
  return el;
}
/** Kullanıcıdan cevap bekleyen kart ekle */
export function interact<T>(el: HTMLElement, setup: (done: (v: T) => void) => void): Promise<T> {
  append(el);
  return awaitUser<T>(setup);
}
/** Kart eklemeden kullanıcı eylemi bekle (sahne kapanırsa iptal edilir) */
export function awaitUser<T>(setup: (done: (v: T) => void) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    pending.push(() => reject(new ChapterAbort()));
    setup(resolve);
  });
}
const plainLen = (html: string): number => html.replace(/<[^>]+>/g, '').length;

/* ───────────── Kartlar ───────────── */
export function title(text: string): void {
  hooks.title(text);
  append(h('div', 'banner pop', `<span>${esc(text)}</span>`));
}

export function quest(html: string): void {
  append(h('div', 'quest pop', `<span class="q-ico">🎮</span><div><div class="q-tag">GÖREV</div>${html}</div>`));
}
export function section(html: string): void { append(h('div', 'section pop', html)); }

export const shuffle = <T>(a: readonly T[]): T[] => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
export { totalXp };

export function say(html = ''): void {
  if (!html.trim()) return;
  append(h('div', 'say pop', html));
}

export async function teach(...paragraphs: string[]): Promise<void> {
  for (const p of paragraphs) {
    const row = h('div', 'npc pop');
    const av = document.createElement('canvas');
    av.width = 84; av.height = 100; av.className = 'npc-av';
    const c = av.getContext('2d') as CanvasRenderingContext2D;
    drawSage(c, 42, 96, { s: 0.85, t: 0.4, robe: theme.robe });
    row.appendChild(av);
    row.appendChild(h('div', 'bubble', p));
    append(row);
    hooks.speak(Math.min(2600, plainLen(p) * 22));
    await sleep(Math.min(850, 260 + plainLen(p) * 4));
  }
}

export function tip(html: string): void { append(h('div', 'tip pop', `<span class="ico">💡</span><div>${html}</div>`)); }
export function warn(html: string): void { append(h('div', 'tip warn pop', `<span class="ico">⚠️</span><div>${html}</div>`)); }

export function showCode(src: string, label = 'TypeScript'): void {
  append(h('div', 'code-card pop', `<div class="code-head"><span class="dots"><i></i><i></i><i></i></span>${esc(label)}</div><pre>${highlight(src)}</pre>`));
}

export async function pause(msg = 'Devam ▶'): Promise<void> {
  const el = h('div', 'actions pop');
  const btn = h('button', 'btn primary', esc(msg.replace(/…$/, '')));
  el.appendChild(btn);
  await interact<void>(el, (done) => {
    btn.addEventListener('click', () => { el.remove(); done(); });
  });
}

export async function choose(prompt: string, options: string[]): Promise<number> {
  const el = h('div', 'card choose pop');
  if (prompt) el.appendChild(h('div', 'prompt', prompt));
  const list = h('div', 'options');
  const btns = options.map((o, i) => {
    const bt = h('button', 'opt');
    bt.innerHTML = `<span class="num">${i + 1}</span><span>${esc(o)}</span>`;
    list.appendChild(bt);
    return bt;
  });
  el.appendChild(list);
  return interact<number>(el, (done) => {
    btns.forEach((bt, i) => bt.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('disabled', ''));
      bt.classList.add('picked');
      done(i);
    }));
  });
}

export async function ask(prompt: string, def = ''): Promise<string> {
  const el = h('div', 'card ask pop', `<label>${prompt}</label>`);
  const input = document.createElement('input');
  input.type = 'text'; input.value = def; input.maxLength = 18; input.placeholder = def;
  const ok = h('button', 'btn primary', 'Tamam');
  const row = h('div', 'row'); row.append(input, ok); el.appendChild(row);
  return interact<string>(el, (done) => {
    const go = (): void => { input.disabled = true; ok.setAttribute('disabled', ''); done(input.value.trim() || def); };
    ok.addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => input.focus(), 50);
  });
}

export async function askNumber(prompt: string, min: number, max: number, def: number): Promise<number> {
  const el = h('div', 'card ask pop', `<label>${prompt} <span class="muted">(${min}–${max})</span></label>`);
  const range = document.createElement('input');
  range.type = 'range'; range.min = String(min); range.max = String(max); range.value = String(def);
  const val = h('span', 'val', String(def));
  const ok = h('button', 'btn primary', 'Tamam');
  const row = h('div', 'row'); row.append(range, val, ok); el.appendChild(row);
  range.addEventListener('input', () => { val.textContent = range.value; });
  return interact<number>(el, (done) => {
    ok.addEventListener('click', () => { range.disabled = true; ok.setAttribute('disabled', ''); done(Number(range.value)); });
  });
}

/* ───────────── Sınav ───────────── */
export async function quiz(id: string, question: string, correct: string, wrongs: string[], explain: string): Promise<void> {
  const shuffled = [correct, ...wrongs].map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
  const already = id in session.answered;
  const el = h('div', 'card quiz pop', `<div class="q"><span class="qmark">❓</span><div>${question}</div></div>`);
  const list = h('div', 'options');
  const btns = shuffled.map((o) => {
    const bt = h('button', 'opt');
    bt.innerHTML = `<span class="num">•</span><span>${esc(o)}</span>`;
    list.appendChild(bt);
    return bt;
  });
  el.appendChild(list);
  const fb = h('div', 'feedback'); el.appendChild(fb);
  let tries = 0;
  return interact<void>(el, (done) => {
    btns.forEach((bt, i) => bt.addEventListener('click', () => {
      tries++;
      if (shuffled[i] === correct) {
        btns.forEach((x) => x.setAttribute('disabled', ''));
        bt.classList.add('right');
        let gain = 0;
        if (!already) { gain = tries === 1 ? 3 : 1; session.answered[id] = gain; saveProgress(); hooks.xp(); }
        fb.innerHTML = already
          ? `<b class="c-green">✔ Doğru!</b> <span class="muted">(daha önce çözdün, tekrar XP yok)</span><div class="why">${esc(explain)}</div>`
          : `<b class="c-green">✔ Doğru! +${gain} XP</b> <span class="muted">toplam ${totalXp()}</span><div class="why">${esc(explain)}</div>`;
        hooks.correct(gain);
        done();
      } else {
        bt.classList.add('wrong'); bt.setAttribute('disabled', '');
        fb.innerHTML = '<b class="c-red">✖ Olmadı, bir daha düşün…</b>';
        hooks.wrong();
      }
    }));
  });
}
