import { ask, askNumber, choose, pause, quiz, say, teach, tip, title, b, em, code, paint } from '../ui';
import { attempt, regions, showRegion, wholeModel } from '../lab';
import { markDone, session } from '../state';
import { Bow, Fists, Staff, Sword, type Weapon } from '../model';
import { cleanName } from './common';

export async function chapter9(): Promise<void> {
  title('BÖLÜM 9 · TASARIM İLKELERİ I  (SRP ve Açık/Kapalı)');
  await teach(
    `OOP'yi bilmek sınıf yazmayı bilmektir; ${em('iyi')} OOP ise sınıfları doğru kesmektir. ${b('SOLID')} 5 ilkenin baş harfleri. Bu bölümde ilk ikisi: ${b('S')}ingle Responsibility, ${b('O')}pen/Closed.`,
    `${b('SRP')}: bir sınıfın değişmesi için ${em('tek bir sebep')} olmalı.`,
  );
  say();
  showRegion('lessons/ch09#GodManager', 'GameManager: her şeyi yapan "tanrı sınıf"');
  attempt(regions('lessons/ch09#GodManager'), `const g = new GameManager();\ng.fight(30);\ng.fight(25);\nshow(g.saved);`);
  tip('Ekran biçimi mi değişecek? Kayıt formatı mı? Savaş kuralı mı? Üçü de AYNI sınıfı değiştirir: kırılgan.');

  await quiz('c9q1', '"Can hesaplama ve hasar kuralı" hangi parçanın işi olmalı?', 'Savaş/karakter sınıfı (Battle, Character)', ['Logger', 'Kayıt (SaveStore) sınıfı'], 'Kural = domain mantığı.');
  await quiz('c9q2', '"Mesajı ekrana veya dosyaya yazmak" kimin işi olmalı?', 'Logger (ayrı bir sınıf/interface)', ['Character', 'Battle'], 'Oyunun Logger interface\'i tam bunun için var; Battle sadece logger.log(...) der.');
  await quiz('c9q3', '"Oyunu diske kaydetmek" kimin işi olmalı?', 'Ayrı bir kayıt sınıfı (SaveStore)', ['Her Character kendi dosyasını yazsın', 'Logger'], 'Kayıt formatı değişince sadece o sınıf değişir.');
  say();
  showRegion('model#Loggers', 'Logger implementasyonları');
  showRegion('model#Battle', 'Battle: sadece savaş akışı');
  tip('Battle yazmayı, ekranı veya düşman çeşitlerini bilmez. Tek sorumluluğu: savaşı yönetmek.');

  await pause('Şimdi Açık/Kapalı ilkesi →');
  await teach(
    `${b('OCP')}: yazılım ${em('genişlemeye açık, değişime kapalı')} olmalı. Yeni özellik = ${em('yeni kod eklemek')}, eski kodu ${em('düzenlemek')} değil.`,
    `Kötü yol: ${code("if (foe instanceof Dragon) … else if (foe instanceof Goblin) …")} her yeni düşmanda savaş koduna dokunmak.`,
    `İyi yol: Battle.foesAct() sadece ${code('foe.takeTurn()')} der. Yeni düşman = yeni sınıf. Polimorfizm + abstraction OCP'nin motoru.`,
  );
  showRegion('model#Troll', 'class Troll: oyunun en yeni düşmanı');
  tip('Troll sınıfı yazıldı; Battle.ts\'e TEK satır eklenmedi.');

  say('\n  🎮 GÖREV: Troll atölyesi, kendi Troll\'ünü tasarla! (Final savaşında karşına çıkacak)');
  const name = cleanName(await ask(paint('cyan', '  Troll\'ün adı [Gorak]: ')), 'Gorak');
  const maxHp = await askNumber('  Canı', 40, 100, 60);
  const regen = await askNumber('  Tur başına yenilenme', 0, 8, 4);
  const weapons: Weapon[] = [new Fists(), new Sword(), new Bow(), new Staff()];
  const w = await choose('  Silahı?', weapons.map((x) => `${x.name} – ${x.info}`));
  session.troll = { name, maxHp, regen, weapon: weapons[w].constructor.name };

  say();
  attempt(wholeModel(), [
    `EnemyFactory.register('custom', (n) => new Troll(n ?? '${name}', ${maxHp}, ${regen}));   // TEK satır`,
    `const troll = EnemyFactory.create('custom');`,
    `troll.weapon = new ${session.troll.weapon}();`,
    `const hero = new Warrior('Deneme');`,
    `const foes = [EnemyFactory.create('goblin'), troll];`,
    `const battle = new Battle(hero, foes, new ConsoleLogger());`,
    `for (let i = 1; i <= 3 && !battle.over; i++) {`,
    `  show('— tur ' + i);`,
    `  battle.heroAttack(foes[0].isAlive ? foes[0] : troll);`,
    `  battle.foesAct();`,
    `}`,
  ].join('\n'));
  say(paint('green', `\n  ✔ ${name} savaş koduna tek satır dokunmadan oyuna girdi! Battle sınıfı Troll'ün varlığından habersiz.`));

  await quiz('c9q4', 'SRP\'nin özeti nedir?', 'Bir sınıfın değişmesi için tek bir sebep olmalı', ['Bir sınıfta tek metot olmalı', 'Bir dosyada tek sınıf olmalı'], 'Sorumluluk = değişim sebebi. Tek sebep → daha az kırılganlık.');
  await quiz('c9q5', 'Yeni düşman eklemek için Battle içine "if (foe instanceof Troll)" yazmak hangi ilkeyi ihlal eder?', 'Açık/Kapalı (OCP): genişletmek için eski kodu değiştirdik', ['SRP', 'Hiçbirini'], 'Polimorfizm sayesinde Battle yeni türleri tanımadan çalışır.');
  await quiz('c9q6', 'OCP\'yi mümkün kılan iki OOP aracı hangisidir?', 'Soyutlama (abstract/interface) ve polimorfizm', ['static ve private', 'readonly ve getter'], 'Sabit sözleşme + değişken uygulamalar.');
  markDone(9);
}
