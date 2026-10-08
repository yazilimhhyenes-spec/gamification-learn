/**
 * 🔬 Laboratuvar arayüzü: gerçek TypeScript derleyicisi + etkileşimli deneme kartları.
 */
import { LabResult, TR, loadCompiler, region, regions, tryCode, wholeModel } from './compiler';
import { highlight } from './highlight';
import { esc } from './highlight';
import { append, h, interact, showCode, sleep, tip } from './ui';

export { regions, region, wholeModel };
export const showRegion = (spec: string, label?: string): void => showCode(region(spec), label ?? spec.split('#')[1]);

let warmed = false;
/** Derleyiciyi arka planda ısıt (ilk denemede bekleme olmasın) */
export function warmUp(): void {
  if (warmed) return;
  warmed = true;
  void loadCompiler();
}

export function renderResult(r: LabResult): HTMLElement {
  const box = h('div', 'res');
  if (r.errors.length) {
    for (const e of r.errors) {
      const tr = TR[e.code] ? `<div class="tr">🇹🇷 ${esc(TR[e.code])}</div>` : '';
      box.appendChild(h('div', 'res-err', `<div class="res-title">✖ DERLEME HATASI <span class="code">TS${e.code}</span></div><pre>${esc(e.message)}</pre>${tr}`));
    }
    box.appendChild(h('div', 'res-note', '→ Kod hiç çalıştırılmadı: TypeScript hatayı çalışmadan önce yakaladı.'));
    return box;
  }
  box.appendChild(h('div', 'res-ok', '✔ Derlendi'));
  for (const o of r.outputs) box.appendChild(h('div', 'res-out', `<span class="arrow">⇒</span><span>${esc(o)}</span>`));
  if (r.runtimeError) box.appendChild(h('div', 'res-err', `<div class="res-title">✖ ÇALIŞMA HATASI</div><pre>${esc(r.runtimeError)}</pre>`));
  return box;
}

async function runInto(host: HTMLElement, decls: string, stmts: string, setup?: string): Promise<void> {
  const holder = h('div', 'attempt pop');
  holder.appendChild(h('pre', 'attempt-code', highlight(stmts)));
  const slot = h('div', 'slot', '<div class="loading"><i></i> derleniyor…</div>');
  holder.appendChild(slot);
  host.appendChild(holder);
  host.scrollTop = host.scrollHeight;
  const r = await tryCode(decls, stmts, { quietPrefix: setup });
  slot.replaceChildren(renderResult(r));
  host.scrollTop = host.scrollHeight;
  document.getElementById('feed')?.scrollTo({ top: 1e9, behavior: 'smooth' });
}

/** Kodu göster, derle, çalıştır; sonucu akışa kart olarak ekle */
export async function attempt(decls: string, stmts: string, setup?: string): Promise<void> {
  const card = h('div', 'card attempt-card pop');
  append(card);
  await runInto(card, decls, stmts, setup);
}

export interface LabItem { code: string; tip?: string; label?: string }

/** Oyuncunun seçtiği denemeleri çalıştıran etkileşimli kart. */
export async function playground(
  decls: string,
  items: LabItem[],
  opts: { setup?: string; need?: number; header?: string } = {},
): Promise<void> {
  warmUp();
  const need = Math.min(opts.need ?? 3, items.length);
  const tried = new Set<number>();
  const card = h('div', 'card lab pop');
  card.appendChild(h('div', 'lab-head', `<span class="lab-ico">🔬</span><div><b>${esc(opts.header ?? 'LABORATUVAR')}</b><div class="muted">En az ${need} deneme yap · gerçek TypeScript derleyicisi çalışıyor</div></div>`));
  if (opts.setup) card.appendChild(h('div', 'lab-setup', `<span class="muted">Hazırlık (her denemeden önce çalışır)</span><pre>${highlight(opts.setup)}</pre>`));
  const list = h('div', 'lab-items');
  const out = h('div', 'lab-out');
  const tipBox = h('div', 'lab-tip');
  const btns = items.map((it, i) => {
    const bt = h('button', 'lab-item');
    bt.innerHTML = `<span class="chk">○</span><code>${esc((it.label ?? it.code.split('\n')[0]).slice(0, 90))}</code>`;
    bt.addEventListener('click', async () => {
      list.classList.add('busy');
      await runInto(out, decls, it.code, opts.setup);
      tried.add(i); bt.classList.add('done'); (bt.querySelector('.chk') as HTMLElement).textContent = '✓';
      tipBox.innerHTML = it.tip ? `<span class="ico">💡</span><div>${it.tip}</div>` : '';
      update();
      list.classList.remove('busy');
    });
    list.appendChild(bt);
    return bt;
  });
  const own = h('button', 'lab-item own', '<span class="chk">✍️</span><code>Kendi kodunu yaz…</code>');
  list.appendChild(own);
  card.appendChild(list);

  const editor = h('div', 'lab-editor hidden');
  const ta = document.createElement('textarea');
  ta.rows = 3; ta.spellcheck = false; ta.placeholder = '// kendi kodunu yaz, çıktı için show(...) kullan';
  const run = h('button', 'btn', 'Çalıştır ▶');
  editor.append(ta, run);
  card.appendChild(editor);
  const doRun = async (): Promise<void> => { if (!ta.value.trim()) return; await runInto(out, decls, ta.value, opts.setup); };
  run.addEventListener('click', doRun);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void doRun(); });
  own.addEventListener('click', () => { editor.classList.toggle('hidden'); ta.focus(); });

  card.append(out, tipBox);
  const foot = h('div', 'lab-foot');
  const prog = h('span', 'progress', `0 / ${need}`);
  const go = h('button', 'btn primary', 'Devam ➡');
  go.setAttribute('disabled', '');
  foot.append(prog, go);
  card.appendChild(foot);
  const update = (): void => {
    prog.textContent = `${Math.min(tried.size, need)} / ${need} deneme`;
    if (tried.size >= need) go.removeAttribute('disabled');
  };

  await interact<void>(card, (done) => {
    go.addEventListener('click', () => { go.setAttribute('disabled', ''); go.textContent = '✓'; list.classList.add('busy'); done(); });
  });
  void btns; void sleep; void tip;
}

/** Serbest laboratuvar: oyunun gerçek sınıflarıyla çok satırlı kod yaz */
export async function freeLab(): Promise<void> {
  warmUp();
  const decls = wholeModel();
  const card = h('div', 'card lab free pop');
  card.appendChild(h('div', 'lab-head', '<span class="lab-ico">🔮</span><div><b>SERBEST LABORATUVAR</b><div class="muted">Oyunun GERÇEK sınıflarıyla kod yaz. Önceki başarılı satırlar hatırlanır. Çıktı için <code>show(...)</code> kullan. Çalıştır: Ctrl/⌘+Enter</div></div>'));
  card.appendChild(h('div', 'chips-label muted', 'Kullanılabilir sınıflar'));
  card.appendChild(h('div', 'chips', ['Warrior', 'Mage', 'Archer', 'Goblin', 'Skeleton', 'Dragon', 'Troll', 'Sword', 'Bow', 'Staff', 'Potion', 'Campfire', 'EnemyFactory', 'Battle', 'MemoryLogger'].map((c) => `<span>${c}</span>`).join('')));
  const examples = [
    ["const w = new Warrior('Ada');\nconst g = new Goblin();\nshow(w.attack(g), g.hp);", 'Saldır'],
    ["new Enemy('x', 1, 1);", 'abstract hatası'],
    ["w.hp = 5;", 'private/readonly'],
    ["w.weapon = new Bow();\nshow(w.attack(g), w.attack(g), w.attack(g));", 'Silah değiştir'],
    ["class Vampire extends Enemy {\n  constructor() { super('Vampir', 50, 11); }\n  override takeTurn(h: Character): string {\n    const bite = h.takeDamage(this.power);\n    this.heal(bite);\n    return `🧛 ısırdı: ${bite}`;\n  }\n}\nEnemyFactory.register('vampire', (n) => new Vampire());\nconst v = EnemyFactory.create('vampire');\nshow(v.takeTurn(w), v.hp);", 'Kendi düşmanını yaz'],
  ] as const;
  const exRow = h('div', 'examples');
  card.appendChild(h('div', 'chips-label muted', 'Örnekler (tıkla, editöre yüklensin)'));
  const ta = document.createElement('textarea');
  ta.rows = 9; ta.spellcheck = false; ta.value = examples[0][0];
  for (const [src, label] of examples) {
    const bt = h('button', 'chip-btn', esc(label));
    bt.addEventListener('click', () => { ta.value = src; ta.focus(); });
    exRow.appendChild(bt);
  }
  card.appendChild(exRow);
  const editor = h('div', 'lab-editor');
  const run = h('button', 'btn primary', 'Çalıştır ▶');
  const reset = h('button', 'btn ghost', 'Oturumu sıfırla');
  editor.append(ta, run, reset);
  card.appendChild(editor);
  const out = h('div', 'lab-out'); card.appendChild(out);
  const history: string[] = [];
  const doRun = async (): Promise<void> => {
    const src = ta.value;
    if (!src.trim()) return;
    const holder = h('div', 'attempt pop');
    holder.appendChild(h('pre', 'attempt-code', highlight(src)));
    const slot = h('div', 'slot', '<div class="loading"><i></i> derleniyor…</div>');
    holder.appendChild(slot); out.appendChild(holder);
    const r = await tryCode(decls, src, { quietPrefix: history.join('\n') || undefined });
    slot.replaceChildren(renderResult(r));
    if (!r.errors.length && !r.runtimeError) history.push(src);
    document.getElementById('feed')?.scrollTo({ top: 1e9, behavior: 'smooth' });
  };
  run.addEventListener('click', doRun);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void doRun(); });
  reset.addEventListener('click', () => { history.length = 0; out.innerHTML = ''; });
  const foot = h('div', 'lab-foot');
  const exit = h('button', 'btn', '🏠 Haritaya dön');
  foot.appendChild(exit); card.appendChild(foot);
  await interact<void>(card, (done) => exit.addEventListener('click', () => done()));
}
