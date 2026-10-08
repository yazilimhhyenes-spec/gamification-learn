import { pause, quiz, say, teach, tip, title, b, em, code, paint, quest } from '../ui';
import { attempt, playground, regions, showRegion, wholeModel } from '../lab';
import { markDone } from '../state';
import { createPlayer } from './common';

export async function chapter3(): Promise<void> {
  title('BÖLÜM 3 · INHERITANCE  (Kalıtım)');
  await teach(
    'Oyunda Savaşçı, Büyücü, Okçu var. Hepsinin adı, canı, saldırısı… ortak. Kopyala-yapıştır yerine ortak kısmı ' + em('tek bir üst sınıfa') + ' koyarız.',
    `${code('extends')} ile alt sınıf, üst sınıfın alan ve metotlarını ${em('miras alır')}. Test: "Knight bir Unit'tir" cümlesi doğru mu? (${b('is-a')} ilişkisi)`,
    `Yeni belirleyici: ${code('protected')} → sınıfın kendisi ve ALT sınıflar görür, dışarısı göremez.`,
  );
  say();
  showRegion('lessons/ch03#Unit', 'class Unit  (üst sınıf)');
  showRegion('lessons/ch03#Knight', 'class Knight extends Unit');
  tip('Knight sadece FARKLI olanı yazdı: armor ve guard(). name, health, describe() bedava miras.');

  await playground(regions('lessons/ch03#Unit', 'lessons/ch03#Knight', 'lessons/ch03#Wizard'), [
    { code: `show(k.describe());`, tip: 'describe() Knight\'ta yazılmadı, Unit\'ten geldi.' },
    { code: `k.guard();\nshow(k.health);`, tip: 'guard() protected hp\'ye erişebildi çünkü Knight bir alt sınıf.' },
    { code: `k.hp = 500;`, tip: 'protected: dışarıdan (alt sınıf olmayan kod) erişemez.' },
    { code: `show(k instanceof Knight, k instanceof Unit, k instanceof Wizard);`, tip: 'Knight aynı zamanda Unit\'tir ama Wizard değildir.' },
    { code: `class Bad extends Unit { constructor() { this.name = 'x'; } }`, tip: 'Alt sınıf constructor\'ı önce super(...) çağırmak zorunda.' },
    { code: `new Knight();`, tip: 'Knight\'ın constructor\'ı bir isim ister.' },
    { code: `const units: Unit[] = [new Knight('Ada'), new Wizard('Merlin')];\nfor (const u of units) show(u.describe());`, tip: 'Bir Unit listesine alt sınıf nesneleri koyabilirsin: "her Knight bir Unit\'tir".' },
  ], { setup: `const k = new Knight('Ada');`, need: 4, header: 'KALITIM LABORATUVARI' });

  await pause('Şimdi oyunun gerçek sınıflarını görelim →');
  showRegion('model#Character', 'class Character  (oyunun üst sınıfı)');
  tip('Bölüm 2\'deki #private kapsülleme burada da var. Bölüm 5-8\'de weapon, static, interface kısımlarını da çözeceğiz.');
  await pause();
  showRegion('model#Heroes', 'Warrior, Mage, Archer');
  tip('super(name, 80, 16): üst sınıfın constructor\'ını çalıştırır. Hepsi Character\'ı miras alır.');

  quest('Kahramanını seç!');
  const player = await createPlayer();
  const cls = player.constructor.name;
  const model = wholeModel();
  say();
  await attempt(model, [
    `const player = new ${cls}('${player.name}');`,
    `show(player instanceof ${cls}, player instanceof Character);`,
    `show('kendi alanları:', Object.keys(player));`,
    `const chain: string[] = [];`,
    `for (let p = Object.getPrototypeOf(player); p; p = Object.getPrototypeOf(p)) chain.push(p.constructor.name);`,
    `show('zincir:', chain.join(' → '));`,
  ].join('\n'));
  tip('name, power, weapon → Character\'dan; sınıfa özel alanlar (armor/element) alt sınıftan. #hp private olduğu için listede YOK.');
  tip(`Zincir: ${cls} → Character → Object. JS bir üyeyi bulamazsa zincirde yukarı doğru arar (prototype zinciri).`);

  say(paint('gray', `Kahramanın "${player.name}" hazır, 7. bölümde silahını seçeceksin.`));
  await quiz('c3q1', 'class Mage ____ Character { … } — boşluğa ne gelmeli?', 'extends', ['inherits', 'implements'], 'extends kalıtım içindir; implements interface içindir (6. bölüm).');
  await quiz('c3q2', 'Alt sınıf constructor\'ında this kullanmadan önce ne yapılmalı?', 'super(...) çağrılmalı', ['new Character() yazılmalı', 'Hiçbir şey, this hazırdır'],
    'Nesnenin üst sınıf kısmı super() ile kurulur; yoksa TS hata verir.');
  await quiz('c3q3', '"protected" üyeye kim erişebilir?', 'Sınıfın kendisi ve alt sınıfları', ['Sadece sınıfın kendisi', 'Herkes'], 'private daha dar (sadece sınıf), protected miras alanlara da açık.');
  await quiz('c3q4', 'Hangisi doğru bir is-a ilişkisidir?', 'Warrior extends Character', ['Sword extends Character', 'Character extends Warrior'],
    'Kılıç bir karakter DEĞİLDİR; karakterin kılıcı VARDIR (has-a) → 7. bölümde kompozisyon.');
  markDone(3);
}
