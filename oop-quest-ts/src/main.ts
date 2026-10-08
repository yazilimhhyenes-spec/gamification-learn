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
import { codex } from './chapters/codex';
import { exam } from './chapters/exam';
import { freeLab } from './lab';
import { loadProgress, resetProgress, session } from './state';
import { ask, choose, closeInput, paint, pause, say, rule, totalXp } from './ui';

const CHAPTERS: { title: string; run: () => Promise<void> }[] = [
  { title: 'Class & Object        – kalıp, nesne, referans, tip güvenliği', run: chapter1 },
  { title: 'Encapsulation         – private, #private, readonly, getter/setter', run: chapter2 },
  { title: 'Inheritance           – extends, super, protected', run: chapter3 },
  { title: 'Polymorphism          – override, dynamic dispatch', run: chapter4 },
  { title: 'Abstraction           – abstract class, template method', run: chapter5 },
  { title: 'Interfaces            – sözleşmeler, implements, rol', run: chapter6 },
  { title: 'Composition           – has-a, Strategy, dependency injection', run: chapter7 },
  { title: 'Static & Overloading  – sınıf üyeleri, fabrika metotları', run: chapter8 },
  { title: 'SOLID I               – SRP, Açık/Kapalı, Troll atölyesi', run: chapter9 },
  { title: 'SOLID II              – Liskov, ISP, Dependency Inversion', run: chapter10 },
  { title: 'FİNAL SAVAŞI          – hepsi bir arada', run: chapter11 },
];

function banner(): void {
  say(paint('cyan', String.raw`
     ___   ___  ____     ___  _   _ _____ ____ _____     _____ ____
    / _ \ / _ \|  _ \   / _ \| | | | ____/ ___|_   _|   |_   _/ ___|
   | | | | | | | |_) | | | | | | | |  _| \___ \ | |       | | \___ \
   | |_| | |_| |  __/  | |_| | |_| | |___ ___) || |       | |  ___) |
    \___/ \___/|_|      \__\_\\___/|_____|____/ |_|       |_| |____/
  `));
  say(paint('bold', '  TypeScript ile Nesne Yönelimli Programlamayı oynayarak öğren!'));
  say(paint('gray', '  Ekrandaki kodlar bu projenin gerçek kaynağıdır; denemelerini gerçek TypeScript derleyicisi sınar.'));
}

async function runChapter(i: number): Promise<void> {
  await CHAPTERS[i].run();
  await pause('Menüye dönmek için Enter…');
}

async function main(): Promise<void> {
  loadProgress();
  banner();
  const arg = parseInt(process.argv[2] ?? '', 10);
  if (arg >= 1 && arg <= CHAPTERS.length) await runChapter(arg - 1);

  for (;;) {
    const next = CHAPTERS.findIndex((_, i) => !session.done.includes(i + 1));
    say();
    rule('═');
    say(paint('bold', '  ANA MENÜ') + paint('gray', `    XP: ${totalXp()}   Tamamlanan: ${session.done.filter((n) => n <= 11).length}/${CHAPTERS.length}`));
    rule('═');
    const opts = [
      next >= 0 ? paint('green', `▶ Sıradaki bölüm: ${next + 1}. ${CHAPTERS[next].title.split('–')[0].trim()}`) : paint('green', '▶ Tüm bölümler bitti! Son sınava geç'),
      ...CHAPTERS.map((c, i) => `${session.done.includes(i + 1) ? paint('green', '✔') : ' '} ${String(i + 1).padStart(2)}. ${c.title}`),
      '🎓 Son Sınav & Karne',
      '🔬 Serbest Laboratuvar (oyunun sınıflarıyla kod yaz)',
      '📖 Kavram Sözlüğü',
      '♻️  İlerlemeyi sıfırla',
      '🚪 Çık',
    ];
    const n = await choose('', opts);
    if (n === 0) { if (next >= 0) await runChapter(next); else { await exam(); await pause('Menüye dönmek için Enter…'); } }
    else if (n <= CHAPTERS.length) await runChapter(n - 1);
    else if (n === CHAPTERS.length + 1) { await exam(); await pause('Menüye dönmek için Enter…'); }
    else if (n === CHAPTERS.length + 2) await freeLab();
    else if (n === CHAPTERS.length + 3) await codex();
    else if (n === CHAPTERS.length + 4) {
      if ((await ask(paint('yellow', '  Emin misin? (e/H): '))).toLowerCase() === 'e') { resetProgress(); say(paint('green', '  Sıfırlandı.')); }
    } else break;
  }
  say(paint('yellow', '\n  Görüşürüz, kahraman! 👋'));
  closeInput();
}

main().catch((e) => { console.error(e); process.exit(1); });
