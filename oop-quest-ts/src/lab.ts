/**
 * 🔬 LABORATUVAR — gerçek TypeScript derleyicisi oyunun içinde çalışır.
 *
 *  1) region():   Ekranda gösterilen kod, bu projenin kendi .ts dosyalarından
 *                 `// #region Ad` … `// #endregion` bloklarıyla okunur.
 *  2) tryCode():  Oyuncunun denediği kodu TypeScript derleyicisiyle KONTROL eder;
 *                 hata yoksa JS'e çevirip GERÇEKTEN çalıştırır.
 *
 * Yani "derleme hatası" ve "çalışma hatası" mesajları tamamen gerçektir.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as vm from 'node:vm';
import * as ts from 'typescript';
import { ask, choose, say, paint, showCode, tip, stripAnsi, pause } from './ui';

/* ───────────────────────── Kod bölgelerini okuma ───────────────────────── */
const fileCache = new Map<string, string>();
function readSrc(file: string): string {
  let t = fileCache.get(file);
  if (t === undefined) {
    t = fs.readFileSync(path.resolve(__dirname, `${file}.ts`), 'utf8');
    fileCache.set(file, t);
  }
  return t;
}

/** spec = "lessons/ch02#SafeHero" veya "model#Character" */
export function region(spec: string): string {
  const [file, name] = spec.split('#');
  const lines = readSrc(file).split('\n');
  const start = lines.findIndex((l) => l.trim() === `// #region ${name}`);
  if (start < 0) throw new Error(`Bölge bulunamadı: ${spec}`);
  const out: string[] = [];
  for (let i = start + 1; i < lines.length && lines[i].trim() !== '// #endregion'; i++) {
    out.push(lines[i].replace(/^export (default )?/, ''));
  }
  return out.join('\n');
}
export const regions = (...specs: string[]): string => specs.map(region).join('\n\n');

/** model.ts'nin tamamı (serbest laboratuvar için) */
export function wholeModel(): string {
  return readSrc('model')
    .split('\n')
    .filter((l) => !/^import /.test(l))
    .map((l) => l.replace(/^export /, ''))
    .join('\n');
}

/** Bir bölgeyi ekranda göster */
export const showRegion = (spec: string, label?: string): void => showCode(region(spec), label ?? spec.split('#')[1]);

/* ───────────────────────── Derleme + çalıştırma ───────────────────────── */
const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  lib: ['lib.es2022.d.ts'],
  strict: true,
  noImplicitOverride: true,
  noEmit: true,
  types: [],
  skipLibCheck: true,
};
const VFILE = '/__lab__/main.ts';
const PRELUDE = 'declare function show(...args: unknown[]): void;\ndeclare const console: { log(...args: unknown[]): void };\n';

let current = '';
const libCache = new Map<string, ts.SourceFile | undefined>();
const host = ts.createCompilerHost(OPTIONS, true);
const origGet = host.getSourceFile.bind(host);
const origExists = host.fileExists.bind(host);
const origRead = host.readFile.bind(host);
host.getSourceFile = (fileName, langOrOpts, onError, shouldCreate) => {
  if (fileName === VFILE) return ts.createSourceFile(fileName, current, ts.ScriptTarget.ES2022, true);
  if (!libCache.has(fileName)) libCache.set(fileName, origGet(fileName, langOrOpts, onError, shouldCreate));
  return libCache.get(fileName);
};
host.fileExists = (f) => f === VFILE || origExists(f);
host.readFile = (f) => (f === VFILE ? current : origRead(f));

export interface LabResult {
  errors: { code: number; message: string }[];
  outputs: string[];
  runtimeError?: string;
}

const MARK = '__LAB_MARK__';

export function tryCode(decls: string, stmts: string, opts: { quietPrefix?: string } = {}): LabResult {
  const body = (opts.quietPrefix ? `${opts.quietPrefix}\nshow('${MARK}');\n` : '') + stmts;
  current = `${PRELUDE}${decls}\n\n${body}\nexport {};\n`;

  const program = ts.createProgram([VFILE], OPTIONS, host);
  const sf = program.getSourceFile(VFILE) as ts.SourceFile;
  const diags = [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)];
  if (diags.length) {
    return {
      errors: diags.map((d) => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') })),
      outputs: [],
    };
  }

  const js = ts.transpileModule(current, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  let outputs: string[] = [];
  const show = (...args: unknown[]): void => {
    outputs.push(args.map((a) => (typeof a === 'string' ? a : util.inspect(a, { colors: true, depth: 2, breakLength: 90 }))).join(' '));
  };
  let runtimeError: string | undefined;
  try {
    vm.runInNewContext(js, { show, console: { log: show }, exports: {}, Math, Array, Number, Object, JSON, Symbol, Map, Set }, { timeout: 1500 });
  } catch (e) {
    const err = e as { name?: string; message?: string };
    runtimeError = `${err?.name ?? 'Error'}: ${err?.message ?? String(e)}`;
  }
  const i = outputs.indexOf(MARK);
  if (i >= 0) outputs = outputs.slice(i + 1);
  return { errors: [], outputs, runtimeError };
}

/* Sık görülen TS hatalarının Türkçe açıklaması */
const TR: Record<number, string> = {
  2341: 'private üyeye sınıfın DIŞINDAN erişilemez. (Encapsulation derleyici tarafından zorlanıyor.)',
  2445: 'protected üyeye sadece sınıfın kendisi ve ALT sınıfları erişebilir.',
  2540: 'Salt-okunur: readonly alan ya da setter\'ı olmayan getter. Sadece constructor\'da atanabilir.',
  2339: 'Bu tipte böyle bir üye yok. Değişkenin TİPİ neyi çağırabileceğini belirler.',
  2345: 'Yanlış tipte argüman verdin.',
  2554: 'Yanlış sayıda argüman verdin.',
  2511: 'abstract sınıftan doğrudan nesne üretilemez.',
  2515: 'Somut (abstract olmayan) sınıf, miras aldığı abstract üyeleri yazmak ZORUNDA.',
  2420: 'Sınıf, implements ettiği interface\'in sözleşmesini tam yerine getirmiyor.',
  4114: 'noImplicitOverride açık: üst sınıfı ezen metot "override" ile işaretlenmeli.',
  4117: '"override" dedin ama üst sınıfta böyle bir üye yok (yazım hatasını yakaladı!).',
  2741: 'Tipte gerekli üyeler eksik: bu nesne beklenen sözleşmeyi karşılamıyor.',
  4113: '"override" dedin ama üst sınıfta böyle bir üye yok (yazım hatasını yakaladı!).',
  2576: 'static üyeye nesne üzerinden değil, SINIF adıyla erişilir.',
  2769: 'Verilen argümanlara uyan hiçbir overload (imza) yok.',
  18013: '#private alan sınıfın dışından kullanılamaz.',
  17009: 'super() çağrılmadan önce this kullanılamaz.',
  2377: 'Türeyen sınıfın constructor\'ı super(...) çağırmak ZORUNDA.',
  2322: 'Tipler uyuşmuyor.',
  2693: 'interface sadece TİP düzeyindedir; çalışma anında yoktur, değer olarak kullanılamaz.',
  2351: 'abstract sınıf "new" ile oluşturulamaz.',
  2674: 'Constructor olarak çağrılamaz.',
  2729: 'Özellik başlatılmadan önce kullanıldı.',
};

export function printResult(r: LabResult): void {
  if (r.errors.length) {
    for (const e of r.errors) {
      say(paint('red', `    ✖ DERLEME HATASI TS${e.code}`));
      for (const l of e.message.split('\n')) say(paint('red', '      ') + l);
      if (TR[e.code]) say(paint('yellow', '      🇹🇷 ' + TR[e.code]));
    }
    say(paint('gray', '      → Kod hiç çalıştırılmadı: TypeScript hatayı çalışmadan önce yakaladı.'));
    return;
  }
  say(paint('gray', '    ✔ Derlendi'));
  for (const o of r.outputs) say(paint('green', '    ⇒ ') + o);
  if (r.runtimeError) say(paint('red', '    ✖ ÇALIŞMA HATASI ') + r.runtimeError);
}

/** Kodu göster, derle, çalıştır, sonucu yaz */
export function attempt(decls: string, stmts: string, setup?: string): LabResult {
  for (const l of dedentLines(stmts)) say(paint('gray', '  ▶ ') + paint('cyan', l));
  const r = tryCode(decls, stmts, { quietPrefix: setup });
  printResult(r);
  return r;
}
const dedentLines = (s: string): string[] => s.split('\n').filter((l, i, a) => l.trim() || (i > 0 && i < a.length - 1));

export interface LabItem { code: string; tip?: string; label?: string }

/**
 * Oyuncunun seçtiği denemeleri çalıştıran etkileşimli menü.
 * need: devam etmeden önce denenmesi gereken minimum deneme sayısı.
 */
export async function playground(
  decls: string,
  items: LabItem[],
  opts: { setup?: string; need?: number; header?: string } = {},
): Promise<void> {
  const need = Math.min(opts.need ?? 3, items.length);
  const tried = new Set<number>();
  if (opts.setup) {
    say(paint('gray', '  Hazırlık (her denemeden önce çalışır):'));
    for (const l of opts.setup.split('\n')) say(paint('gray', '    ' + l));
  }
  say(paint('bold', `\n  🔬 ${opts.header ?? 'LABORATUVAR'}  ${paint('gray', `(en az ${need} deneme yap; gerçek TypeScript derleyicisi çalışıyor)`)}`));
  for (;;) {
    say();
    const labels = items.map((it, i) => {
      const first = (it.label ?? it.code.split('\n')[0]).slice(0, 70);
      return `${tried.has(i) ? paint('green', '✓ ') : '  '}${first}`;
    });
    const n = await choose('  Ne denersin?', [...labels, '✍️  Kendi kodunu yaz (tek satır)', '➡️  Devam']);
    say();
    if (n === items.length + 1) {
      if (tried.size < need) { say(paint('red', `  Biraz daha dene! En az ${need} farklı deneme gerekli (${tried.size}/${need}).`)); continue; }
      return;
    }
    if (n === items.length) {
      const line = await ask(paint('cyan', '  kod> '));
      if (!line) continue;
      attempt(decls, line, opts.setup);
      continue;
    }
    tried.add(n);
    attempt(decls, items[n].code, opts.setup);
    if (items[n].tip) tip(items[n].tip as string);
  }
}

/** Serbest laboratuvar: bütün oyun sınıflarıyla konuş (oturum boyunca değişkenler hatırlanır) */
export async function freeLab(): Promise<void> {
  const decls = wholeModel();
  say();
  say(paint('bold', '  🔬 SERBEST LABORATUVAR') + paint('gray', '  — oyunun GERÇEK sınıflarıyla oyna. Çıkmak için ":q"'));
  say(paint('gray', '  Kullanılabilir: Warrior, Mage, Archer, Goblin, Skeleton, Dragon, Troll, Sword, Bow, Staff, Potion, Campfire,'));
  say(paint('gray', '                  EnemyFactory, Battle, MemoryLogger … Çıktı için show(...) kullan.'));
  say(paint('gray', '  Örnek:  const w = new Warrior(\'Ada\'); const g = new Goblin(); show(w.attack(g), g.hp);'));
  say(paint('gray', '  Deneme:  new Enemy(\'x\', 1, 1)   |   w.hp = 5   |   w.weapon = new Bow()   |   g.takeTurn(w)'));
  const history: string[] = [];
  for (;;) {
    const line = await ask(paint('cyan', '\n  lab> '));
    if (line === ':q' || line === 'q') return;
    if (!line) continue;
    const prefix = history.join('\n');
    const r = tryCode(decls, line, { quietPrefix: prefix || undefined });
    printResult(r);
    if (!r.errors.length && !r.runtimeError) history.push(line);
  }
}

export { stripAnsi, pause };
