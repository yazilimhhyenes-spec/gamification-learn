import './style.css';
import { chapter1 } from './chapters/ch01';
import { chapter2 } from './chapters/ch02';
import { chapter3 } from './chapters/ch03';
import { chapter4 } from './chapters/ch04';
import { chapter5 } from './chapters/ch05';
import { chapter6 } from './chapters/ch06';
import { chapter7 } from './chapters/ch07';
import { chapter8 } from './chapters/ch08';
import { chapter9 } from './chapters/ch09';
import { chapter10 } from './chapters/ch10';
import { chapter11 } from './chapters/ch11';
import { TERMS } from './chapters/codex';
import { chapterExam } from './chapters/exam';
import { freeLab, warmUp } from './lab';
import { SceneView, type SceneKey } from './scene';
import { Stage } from './stage';
import { levelOf, loadProgress, resetProgress, session, totalXp } from './state';
import { ChapterAbort, append, cancelPending, clearFeed, h, hooks, mountFeed, teach, title } from './ui';
import { POIS, WW, WH, WorldView, type Poi } from './world';
import { esc } from './highlight';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

loadProgress();
mountFeed($('feed'));

const worldCanvas = $<HTMLCanvasElement>('world');
const worldStage = new Stage(worldCanvas, WW, WH);
const world = new WorldView(worldCanvas);
worldStage.setView(world);
worldStage.start();

const sceneStage = new Stage($<HTMLCanvasElement>('stage'));
sceneStage.start();
hooks.setView = (v) => sceneStage.setView(v);

/* ───────────── HUD ───────────── */
function refreshHud(): void {
  const xp = totalXp(), lv = levelOf(xp);
  $('lvl').textContent = `Lv ${lv}`;
  $('xpfill').style.width = `${((xp % 12) / 12) * 100}%`;
  $('xpnum').textContent = `${xp} XP`;
  $('prog').textContent = `🏁 ${session.done.filter((n) => n <= 11).length}/11`;
}
hooks.xp = refreshHud;
refreshHud();

/* ───────────── Bölümler ───────────── */
const LAB = async (): Promise<void> => {
  title('🔮 RÜN LABORATUVARI');
  await teach(
    'Burası oyunun gerçek sınıflarıyla (Warrior, Goblin, Battle, EnemyFactory …) istediğin kodu yazıp denediğin laboratuvar. TypeScript derleyicisi her satırı denetler; hata yoksa kod çalışır.',
    'Bir ipucu: <em class="hl">class Vampire extends Enemy …</em> yazıp <code>EnemyFactory</code>\'ye kaydet. Savaş koduna dokunmadan oyuna girecek. (Açık/Kapalı ilkesi!)',
  );
  await freeLab();
};

const RUNNERS: Record<string, { key: SceneKey; run: () => Promise<void>; mark?: number }> = {
  '1': { key: 1, run: chapter1 }, '2': { key: 2, run: chapter2 }, '3': { key: 3, run: chapter3 },
  '4': { key: 4, run: chapter4 }, '5': { key: 5, run: chapter5 }, '6': { key: 6, run: chapter6 },
  '7': { key: 7, run: chapter7 }, '8': { key: 8, run: chapter8 }, '9': { key: 9, run: chapter9 },
  '10': { key: 10, run: chapter10 }, '11': { key: 11, run: chapter11 },
  lab: { key: 'lab', run: LAB }, exam: { key: 'exam', run: chapterExam },
};

let runToken = 0;
let inScene = false;

function showWorld(): void {
  runToken++;
  cancelPending();
  inScene = false;
  $('scene-screen').classList.add('hidden');
  $('world-screen').classList.remove('hidden');
  $('btn-map').classList.add('hidden');
  refreshHud();
}

function renderConcepts(ch: number): void {
  const col = document.querySelector('.scene-col') as HTMLElement;
  col.querySelector('.concepts')?.remove();
  const terms = TERMS.filter(([, c]) => c === ch);
  if (!terms.length) return;
  const el = h('div', 'concepts', `<div class="c-title">📌 Bu bölümün kavramları</div>` + terms.map(([t, , d]) => `<div class="c-term"><code>${esc(t)}</code><span>${esc(d)}</span></div>`).join(''));
  col.appendChild(el);
}

function nextChapter(): Poi | undefined {
  for (let i = 1; i <= 11; i++) if (!session.done.includes(i)) return POIS.find((p) => p.id === i);
  return session.done.includes(12) ? undefined : POIS.find((p) => p.id === 'exam');
}

async function openPoi(p: Poi): Promise<void> {
  if (p.id === 'codex') { showCodex(); return; }
  const r = RUNNERS[String(p.id)];
  if (!r) return;
  const token = ++runToken;
  cancelPending();
  clearFeed();
  inScene = true;
  $('world-screen').classList.add('hidden');
  $('scene-screen').classList.remove('hidden');
  $('btn-map').classList.remove('hidden');
  renderConcepts(typeof r.key === 'number' ? r.key : 0);
  const view = new SceneView(r.key);
  view.bind();
  sceneStage.setView(view);
  hooks.title = () => {};
  warmUp();
  try {
    await r.run();
    if (token !== runToken) return;
    const nxt = nextChapter();
    const done = h('div', 'card finish pop', `<div class="fin-title">✨ ${esc(p.label)} tamamlandı!</div>`);
    const row = h('div', 'row');
    const back = h('button', 'btn', '🗺️ Haritaya dön');
    back.addEventListener('click', showWorld);
    row.appendChild(back);
    if (nxt && nxt.id !== p.id) {
      const go = h('button', 'btn primary', `▶ Sıradaki: ${esc(nxt.label)}`);
      go.addEventListener('click', () => void openPoi(nxt));
      row.appendChild(go);
    }
    done.appendChild(row);
    append(done);
    refreshHud();
  } catch (e) {
    if (!(e instanceof ChapterAbort)) { console.error(e); append(h('div', 'tip warn', `<span class="ico">⚠️</span><div>Beklenmeyen hata: ${esc(String(e))}</div>`)); }
  }
}
world.onEnter = (p) => void openPoi(p);

/* ───────────── Modallar ───────────── */
function openModal(html: string): void {
  $('modal-body').innerHTML = html;
  $('modal').classList.remove('hidden');
}
const closeModal = (): void => $('modal').classList.add('hidden');
$('modal-x').addEventListener('click', closeModal);
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });

function showCodex(): void {
  openModal(`<h2>📖 Kavram Sözlüğü</h2><input id="codex-q" class="search" placeholder="Ara… (örn. polimorfizm, private, static)" /><div id="codex-list"></div>`);
  const render = (q: string): void => {
    const f = q.trim().toLowerCase();
    const rows = TERMS.filter(([t, , d]) => !f || t.toLowerCase().includes(f) || d.toLowerCase().includes(f));
    $('codex-list').innerHTML = rows.map(([t, ch, d]) => `<div class="term"><div class="t">${esc(t)}<span class="chp">Bölüm ${ch}</span></div><div class="d">${esc(d)}</div></div>`).join('') || '<p class="muted">Sonuç yok.</p>';
  };
  render('');
  const input = $<HTMLInputElement>('codex-q');
  input.addEventListener('input', () => render(input.value));
  input.focus();
}

function showHelp(): void {
  openModal(`
    <h2>⚔️ OOP Quest'e hoş geldin!</h2>
    <p>Nesne Yönelimli Programlamayı <b>oynayarak</b> öğreneceksin. Hem harita hem sınıflar TypeScript ile yazıldı.</p>
    <ul class="howto">
      <li>🗺️ <b>Haritada</b> <kbd>W A S D</kbd> / oklarla yürü. Bir binaya <b>tıkla</b> ya da kapısına gelip <kbd>E</kbd> bas.</li>
      <li>🧙 Her bölümde <b>Bilge</b> anlatır, kodu görürsün; <b>laboratuvar</b> kartlarında kodu <b>gerçek TypeScript derleyicisiyle</b> denersin.</li>
      <li>❓ Sınav sorularını ilk denemede bilirsen <b>3 XP</b>, sonra <b>1 XP</b>.</li>
      <li>⚔️ <b>Bölüm 11</b>'de hepsini bir arada kullandığın 2D final savaşı seni bekliyor.</li>
      <li>⭐ Önerilen yol: sarı <b>rozetli ve oklu</b> binadan devam et (1 → 11 → Sınav).</li>
    </ul>
    <button class="btn primary" id="help-go">Maceraya başla ▶</button>`);
  $('help-go').addEventListener('click', closeModal);
}

$('btn-codex').addEventListener('click', showCodex);
$('btn-help').addEventListener('click', showHelp);
$('btn-map').addEventListener('click', showWorld);
$('btn-reset').addEventListener('click', () => {
  if (confirm('Tüm ilerleme (XP, bölümler, kahraman) silinsin mi?')) { resetProgress(); refreshHud(); if (inScene) showWorld(); }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!$('modal').classList.contains('hidden')) closeModal(); else if (inScene) showWorld(); }
});

if (!session.done.length && !Object.keys(session.answered).length) showHelp();
(window as unknown as { __oopq: unknown }).__oopq = { openPoi, POIS, session, showWorld };
