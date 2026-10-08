/**
 * 🔬 Tarayıcıda çalışan GERÇEK TypeScript derleyicisi.
 *
 *  - region():  ekranda gösterilen kod, projenin kendi .ts dosyalarındaki
 *               `// #region Ad` … `// #endregion` bloklarından okunur.
 *  - tryCode(): oyuncunun kodunu derleyiciyle denetler; hata yoksa JS'e çevirip
 *               bir Web Worker içinde çalıştırır (sonsuz döngüye karşı zaman aşımı var).
 */
import type * as TS from 'typescript';
import modelRaw from './model.ts?raw';
import { WORKER_SRC } from './worker-src';

/* ───────────── Kod bölgelerini okuma ───────────── */
const lessonSrc = import.meta.glob('./lessons/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function readSrc(file: string): string {
  if (file === 'model') return modelRaw;
  const t = lessonSrc[`./${file}.ts`];
  if (t === undefined) throw new Error(`Kaynak bulunamadı: ${file}`);
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

export function wholeModel(): string {
  return modelRaw
    .split('\n')
    .filter((l) => !/^import /.test(l))
    .map((l) => l.replace(/^export /, ''))
    .join('\n');
}

/* ───────────── Derleyiciyi tembel yükle ───────────── */
const libLoaders: Record<string, () => Promise<unknown>> = {
  ...import.meta.glob('/node_modules/typescript/lib/lib.es*.d.ts', { query: '?raw', import: 'default' }),
  ...import.meta.glob('/node_modules/typescript/lib/lib.decorators*.d.ts', { query: '?raw', import: 'default' }),
};

interface Compiler { ts: typeof TS; libs: Map<string, string> }
let compilerPromise: Promise<Compiler> | null = null;

export function loadCompiler(): Promise<Compiler> {
  if (!compilerPromise) {
    compilerPromise = (async () => {
      const [mod, entries] = await Promise.all([
        import('typescript'),
        Promise.all(Object.entries(libLoaders).map(async ([p, load]) => [p.split('/').pop() as string, (await load()) as string] as const)),
      ]);
      const ts = ((mod as unknown as { default?: typeof TS }).default ?? mod) as typeof TS;
      return { ts, libs: new Map(entries) };
    })();
  }
  return compilerPromise;
}

/* ───────────── Derleme ───────────── */
const VFILE = '/__lab__/main.ts';
const PRELUDE = 'declare function show(...args: unknown[]): void;\ndeclare const console: { log(...args: unknown[]): void };\n';
const MARK = '__LAB_MARK__';

export interface LabResult {
  errors: { code: number; message: string }[];
  outputs: string[];
  runtimeError?: string;
}

const sfCache = new Map<string, TS.SourceFile>();

function compile(c: Compiler, source: string): { code: number; message: string }[] {
  const { ts, libs } = c;
  const options: TS.CompilerOptions = {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, lib: ['lib.es2022.d.ts'],
    strict: true, noImplicitOverride: true, noEmit: true, types: [], skipLibCheck: true,
  };
  const host: TS.CompilerHost = {
    getSourceFile: (f, lang) => {
      if (f === VFILE) return ts.createSourceFile(f, source, lang, true);
      const name = f.split('/').pop() as string;
      const txt = libs.get(name);
      if (txt === undefined) return undefined;
      let sf = sfCache.get(name);
      if (!sf) { sf = ts.createSourceFile(f, txt, lang, true); sfCache.set(name, sf); }
      return sf;
    },
    getDefaultLibFileName: () => '/lib/lib.d.ts',
    getDefaultLibLocation: () => '/lib',
    writeFile: () => undefined,
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (f) => f === VFILE || libs.has(f.split('/').pop() as string),
    readFile: (f) => (f === VFILE ? source : libs.get(f.split('/').pop() as string)),
  };
  const program = ts.createProgram([VFILE], options, host);
  const sf = program.getSourceFile(VFILE) as TS.SourceFile;
  return [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)].map((d) => ({
    code: d.code,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  }));
}

function runInWorker(js: string): Promise<{ out: string[]; error?: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const w = new Worker(url);
    const done = (r: { out: string[]; error?: string }): void => { clearTimeout(timer); w.terminate(); URL.revokeObjectURL(url); resolve(r); };
    const timer = setTimeout(() => done({ out: [], error: 'ZamanAşımı: kod 1.5 saniyede bitmedi (sonsuz döngü mü?)' }), 1500);
    w.onmessage = (e) => done(e.data);
    w.onerror = (e) => done({ out: [], error: `Error: ${e.message}` });
    w.postMessage(js);
  });
}

export async function tryCode(decls: string, stmts: string, opts: { quietPrefix?: string } = {}): Promise<LabResult> {
  const c = await loadCompiler();
  const body = (opts.quietPrefix ? `${opts.quietPrefix}\nshow('${MARK}');\n` : '') + stmts;
  const source = `${PRELUDE}${decls}\n\n${body}\nexport {};\n`;

  const errors = compile(c, source);
  if (errors.length) return { errors, outputs: [] };

  const js = c.ts.transpileModule(source, { compilerOptions: { target: c.ts.ScriptTarget.ES2022, module: c.ts.ModuleKind.CommonJS } }).outputText;
  const r = await runInWorker(js);
  const i = r.out.indexOf(MARK);
  return { errors: [], outputs: i >= 0 ? r.out.slice(i + 1) : r.out, runtimeError: r.error };
}

/* Sık görülen TS hatalarının Türkçe açıklaması */
export const TR: Record<number, string> = {
  2341: 'private üyeye sınıfın DIŞINDAN erişilemez. (Encapsulation derleyici tarafından zorlanıyor.)',
  2445: 'protected üyeye sadece sınıfın kendisi ve ALT sınıfları erişebilir.',
  2540: "Salt-okunur: readonly alan ya da setter'ı olmayan getter. Sadece constructor'da atanabilir.",
  2339: 'Bu tipte böyle bir üye yok. Değişkenin TİPİ neyi çağırabileceğini belirler.',
  2345: 'Yanlış tipte argüman verdin.',
  2554: 'Yanlış sayıda argüman verdin.',
  2511: 'abstract sınıftan doğrudan nesne üretilemez.',
  2515: 'Somut (abstract olmayan) sınıf, miras aldığı abstract üyeleri yazmak ZORUNDA.',
  2420: "Sınıf, implements ettiği interface'in sözleşmesini tam yerine getirmiyor.",
  4114: 'noImplicitOverride açık: üst sınıfı ezen metot "override" ile işaretlenmeli.',
  4113: '"override" dedin ama üst sınıfta böyle bir üye yok (yazım hatasını yakaladı!).',
  4117: '"override" dedin ama üst sınıfta böyle bir üye yok (yazım hatasını yakaladı!).',
  2741: 'Tipte gerekli üyeler eksik: bu nesne beklenen sözleşmeyi karşılamıyor.',
  2576: 'static üyeye nesne üzerinden değil, SINIF adıyla erişilir.',
  2769: 'Verilen argümanlara uyan hiçbir overload (imza) yok.',
  18013: '#private alan sınıfın dışından kullanılamaz.',
  17009: 'super() çağrılmadan önce this kullanılamaz.',
  2377: "Türeyen sınıfın constructor'ı super(...) çağırmak ZORUNDA.",
  2322: 'Tipler uyuşmuyor.',
  2693: 'interface sadece TİP düzeyindedir; çalışma anında yoktur, değer olarak kullanılamaz.',
  2351: 'abstract sınıf "new" ile oluşturulamaz.',
};
