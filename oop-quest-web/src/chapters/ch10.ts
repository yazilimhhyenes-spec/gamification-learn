import { pause, quiz, say, section, teach, tip, title, b, em } from '../ui';
import { attempt, playground, regions, showRegion, wholeModel } from '../lab';
import { markDone } from '../state';

export async function chapter10(): Promise<void> {
  title('BÖLÜM 10 · TASARIM İLKELERİ II  (L, I, D)');
  await teach(`SOLID'in kalan üç harfi: ${b('L')}iskov, ${b('I')}nterface Segregation, ${b('D')}ependency Inversion.`);

  /* ── LSP ── */
  section(`${b('L — Liskov Yer Değiştirme')}: alt sınıf, üst sınıfın YERİNE geçtiğinde kod bozulmamalı.`);
  showRegion('lessons/ch10#LspBad', 'Kötü: "Keşiş" bir Foe mu?');
  await playground(regions('lessons/ch10#LspBad', 'lessons/ch10#LspGood'), [
    { code: `const foes: Foe[] = [new Wolf(), new PeacefulMonk(), new Wolf()];\nfor (const f of foes) show(f.takeTurn());`, label: 'Foe listesinde Keşiş ile döngü',
      tip: 'Döngü Foe\'dan söz verileni bekliyordu; Keşiş sözleşmeyi bozup çöktürdü. Kalıtım "is-a" demek, ama davranış olarak da "is-a" olmalı.' },
    { code: `const foes: Attacker[] = [new Wolf2()];\nfor (const f of foes) show(f.takeTurn());\nnew Monk().meditate();`, label: 'İyi: Keşiş Attacker olmaz, kendi rolü var',
      tip: 'Keşiş artık Attacker listesine giremez; derleyici bunu garanti eder. Hata, çalışma yerine tasarımda önlendi.' },
    { code: `const a: Attacker[] = [new Monk()];`, tip: 'Keşiş Attacker değil: yanlış yerleştirme derleme zamanında reddedilir.' },
  ], { need: 2, header: 'LISKOV LABORATUVARI' });
  await pause();

  /* ── ISP ── */
  section(`${b('I — Interface Segregation')}: kimseyi kullanmadığı metotlara zorlama. Büyük interface yerine küçük roller.`);
  showRegion('lessons/ch10#IspBad', 'Kötü: şişman interface');
  await playground(regions('lessons/ch10#IspBad', 'lessons/ch10#IspGood'), [
    { code: `class Jelly implements Creature { attack(): string { return 'blup'; } }`, label: 'Jelly (uçmaz, yüzmez) şişman interface\'i implemente eder',
      tip: 'Uçamayan jöle fly() ve swim() yazmaya zorlanıyor: gereksiz yük.' },
    { code: `show(new Bat().attack(), new Bat().fly());\nshow(new Duck().fly(), new Duck().swim());\nshow(new Slime2().attack());`, label: 'Küçük roller: Attacker2, Flyer, Swimmer',
      tip: 'Her sınıf sadece yapabildiği rolleri imzalar.' },
    { code: `const flyers: Flyer[] = [new Bat(), new Duck()];\nfor (const f of flyers) show(f.fly());`, tip: 'Rol bazlı listeler: "uçabilen herkes" doğal olarak ifade edilir.' },
  ], { need: 2, header: 'INTERFACE SEGREGATION LABORATUVARI' });
  await pause();

  /* ── DIP ── */
  section(`${b('D — Dependency Inversion')}: üst seviye kod, somut sınıfa değil ${em('soyutlamaya')} bağımlı olmalı; bağımlılık ${em('dışarıdan verilmeli')}.`);
  showRegion('lessons/ch10#Coupled', 'Kötü: somut sınıfa sıkı bağlı');
  showRegion('lessons/ch10#Duel', 'İyi: Logger sözleşmesine bağımlı');
  const dipDecls = regions('model#Interfaces', 'model#Loggers', 'lessons/ch10#Duel', 'lessons/ch10#Coupled');
  await playground(dipDecls, [
    { code: `new Duel(new ShowLogger()).run();`, tip: 'ShowLogger ile düello çıktısı ekrana düştü.' },
    { code: `const memory = new MemoryLogger();\nnew Duel(memory).run();\nshow('hafızadaki satırlar:', memory.lines);`, label: 'Aynı Duel, bu kez MemoryLogger (test gibi)',
      tip: 'Duel kodu HİÇ değişmedi, sadece enjekte edilen bağımlılık değişti. Testlerde sahte logger takmak bu yüzden kolay.' },
    { code: `const d = new CoupledDuel();\nd.run();\nshow(d.logger);`, tip: 'CoupledDuel kendi logger\'ını içeride yarattı: dışarıdan değiştirmek imkânsız (ve private).' },
  ], { need: 2, header: 'DEPENDENCY INVERSION LABORATUVARI' });

  say('Aynı fikir oyunun gerçek Battle sınıfında: Logger enjekte ediliyor.');
  await attempt(wholeModel(), [
    `const memory = new MemoryLogger();`,
    `const battle = new Battle(new Warrior('Test'), [new Goblin()], memory);   // ekrana hiç yazmadan savaş`,
    `while (!battle.over) { battle.heroAttack(battle.livingFoes[0]); battle.foesAct(); }`,
    `show('kazandı mı?', battle.won, '| kaydedilen satır:', memory.lines.length);`,
    `show(memory.lines);`,
  ].join('\n'));
  tip('Bütün savaşı ekrana tek satır basmadan test ettik: DIP + interface + polimorfizmin ortak ödülü.');

  await quiz('c10q1', 'PeacefulMonk extends Foe ve takeTurn() hata fırlatıyor. Hangi ilke ihlal edildi?', 'Liskov (LSP): alt sınıf üst sınıfın yerine geçemiyor', ['SRP', 'Dependency Inversion'], 'Çözüm: Keşiş Foe olmamalı; ortak davranış yoksa kalıtım yanlış araçtır.');
  await quiz('c10q2', 'Şişman Creature interface\'ini Jelly\'e implemente ettirmek neyi ihlal eder?', 'Interface Segregation (ISP): kullanmadığı metotlara zorlandı', ['Liskov', 'Açık/Kapalı'], 'Küçük, rol odaklı interface\'ler tercih edilir.');
  await quiz('c10q3', 'Battle neden "Logger" interface\'ini constructor\'dan alıyor?', 'Somut loggera bağımlı kalmasın; ekran, dosya veya test logger\'ı takılabilsin (DIP)', ['Daha hızlı çalışsın diye', 'Logger static olduğu için'], 'Üst seviye kod (Battle) soyutlamaya bağlı, ayrıntı (ConsoleLogger) dışarıdan verilir.');
  await quiz('c10q4', 'SOLID\'deki 5 harfin doğru sıralaması hangisi?', 'SRP, OCP, LSP, ISP, DIP', ['SRP, OCP, ISP, LSP, DIP', 'OCP, SRP, DIP, LSP, ISP'], 'S-O-L-I-D: Single, Open/Closed, Liskov, Interface Segregation, Dependency Inversion.');
  markDone(10);
}
