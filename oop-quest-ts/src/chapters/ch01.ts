import { ask, askNumber, pause, quiz, say, teach, tip, title, b, em, code } from '../ui';
import { attempt, playground, regions, showRegion } from '../lab';
import { markDone } from '../state';
import { cleanName } from './common';

export async function chapter1(): Promise<void> {
  title('BÖLÜM 1 · CLASS & OBJECT  (Sınıf ve Nesne)');
  await teach(
    `${b('Class (sınıf)')} bir ${em('kalıp / plandır')}. Kendisi bir kahraman değildir; kahramanın NASIL olacağını tarif eder.`,
    `${b('Object (nesne)')} o kalıptan ${em('new')} ile üretilen gerçek örnektir. Aynı kalıptan istediğin kadar nesne üretirsin.`,
    'Kurabiye kalıbı = class, kurabiyeler = object. Her kurabiyenin kendi çikolatası olur: buna ' + em('state (durum)') + ' denir.',
    `TypeScript = JavaScript + ${em('tipler')}. Alanların tipini (${code('name: string')}) yazarız; derleyici hataları kod ÇALIŞMADAN yakalar.`,
  );
  say();
  showRegion('lessons/ch01#Hero', 'class Hero');
  await teach(
    `${code('name, hp, power')} → ${b('alan (field)')}: nesnenin verisi.`,
    `${code('constructor')} → nesne doğarken bir kez çalışır, alanları kurar.`,
    `${code('hit()')} → ${b('metot (method)')}: nesnenin davranışı. ${code('this')} = "şu an konuşan nesne".`,
  );

  say('\n  🎮 GÖREV: Kendi kahramanını yarat!');
  const name = cleanName(await ask('  Kahramanının adı [Aylin]: '), 'Aylin');
  const power = await askNumber('  Gücü', 5, 20, 12);
  const hp = await askNumber('  Canı', 50, 150, 100);
  const decls = regions('lessons/ch01#Hero');

  say();
  attempt(decls, [
    `const hero = new Hero('${name}', ${hp}, ${power});`,
    `const slime = new Hero('Balçık', 40, 5);`,
    `show(hero);`,
    `show(slime);`,
  ].join('\n'));
  tip('Aynı sınıf (Hero), iki ayrı nesne, iki ayrı durum.');

  await pause('Şimdi nesneleri vuruştur →');
  say();
  attempt(decls, [
    `const hero = new Hero('${name}', ${hp}, ${power});`,
    `const slime = new Hero('Balçık', 40, 5);`,
    `show(hero.hit(slime));`,
    `show('slime.hp =', slime.hp, '| hero.hp =', hero.hp);`,
    `show(slime.hit(hero));`,
    `show('hero.hp =', hero.hp);`,
  ].join('\n'));
  tip('hit() tek bir kod; ama this farklı nesne olduğu için sonuç farklı. Her nesne KENDİ alanlarını taşır.');

  await pause('Şimdi nesnelerin bellekte nasıl yaşadığına bakalım →');
  await teach(`Nesne değişkenleri nesnenin ${em('kendisini')} değil, ona giden ${em('referansı')} (etiketi) tutar.`);
  say();
  attempt(decls, [
    `const a = new Hero('Ali', 100, 10);`,
    `const b = a;                      // yeni nesne DEĞİL: aynı nesneye ikinci etiket`,
    `b.hp = 1;`,
    `show('a.hp =', a.hp);`,
    `const c = new Hero('Ali', 1, 10);`,
    `show('a === b ?', a === b);`,
    `show('a === c ?', a === c);        // aynı değerler ama FARKLI nesne`,
  ].join('\n'));
  tip('Eşitlik (===) nesnelerde "aynı nesne mi?" demektir, "aynı değerler mi?" değil.');

  await playground(decls, [
    { code: `new Hero('Ali', 'yüz', 10);`, tip: 'hp: number demiştik. Tip uyuşmazlığı çalışmadan önce yakalandı.' },
    { code: `new Hero('Ali', 100);`, tip: 'constructor 3 parametre ister.' },
    { code: `hero.mana = 50;`, tip: 'Hero sınıfında mana diye bir alan tanımlamadık; yazım hatalarını derleyici yakalar.' },
    { code: `hero.hit('balçık');`, tip: 'hit(target: Hero) bir Hero bekliyor.' },
    { code: `show(hero.hit(new Hero('Balçık', 40, 5)));`, tip: 'Doğru kullanım sorunsuz derlenir ve çalışır.' },
  ], { setup: `const hero = new Hero('Ali', 100, 10);`, need: 3, header: 'TİP GÜVENLİĞİ LABORATUVARI' });

  await quiz('c1q1', 'Hangisi bir NESNE (object) üretir?', `new Hero('Ali', 100, 10)`, ['class Hero { }', 'hero.hit(slime)'],
    `'new' anahtar kelimesi constructor'ı çalıştırıp yeni bir nesne döndürür.`);
  await quiz('c1q2', 'const b = a; b.hp = 1; yazdık. a.hp ne olur?', '1 olur: a ve b AYNI nesneyi gösterir', ['Değişmez, b kopya bir nesnedir', 'Hata fırlatılır'],
    'Atama nesneyi kopyalamaz, referansı kopyalar.');
  await quiz('c1q3', "hero.mana = 50 satırındaki hata ne zaman ortaya çıkar?", 'Kod çalışmadan önce, derleme sırasında', ['Sadece kod çalışırken', 'Hiç çıkmaz'],
    'TypeScript statik tip denetimidir: hatalar daha çalıştırmadan görülür.');
  markDone(1);
}
