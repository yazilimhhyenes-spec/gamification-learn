import { choose, pause, quest, quiz, say, teach, tip, title, b, em, code, paint } from '../ui';
import { attempt, playground, regions, showRegion, wholeModel } from '../lab';
import { markDone, saveProgress, session } from '../state';
import { Bow, Fists, Staff, Sword, type Weapon } from '../model';
import { ensurePlayer } from './common';

export async function chapter7(): Promise<void> {
  title('BÖLÜM 7 · COMPOSITION  (Kalıtım yerine Birleştirme)');
  await teach(
    `Kalıtım ${b('is-a')} (… bir …\'dir), kompozisyon ${b('has-a')} (… sahiptir) ilişkisidir. Savaşçı bir Karakter'dir ama bir Kılıç ${em('değildir')}: Savaşçının kılıcı ${em('vardır')}.`,
    'Silahı kalıtımla çözmeye kalkarsak sınıf patlaması olur:',
  );
  say(paint('gray', `
     Knight → FireSwordKnight, IceSwordKnight, FireBowKnight …
     Archer → FireBowArcher, IceBowArcher, FireSwordArcher …    (sınıf sayısı = karakter × silah!)
     Üstelik silahı OYUN SIRASINDA değiştiremezsin: sınıf nesne doğarken belirlenir.`));
  await teach(
    `Çözüm: davranışı ayrı bir nesneye (${em('Weapon')}) ver, karaktere ${em('parça olarak tak')}. Bu kalıbın adı ${b('Strategy')}: algoritma (silah) çalışma anında değiştirilebilir.`,
    `Fighter silahı ${em('constructor\'dan alır')} (${b('dependency injection')}): kendi içinde ${code('new Sword()')} yazmaz, böylece her silahla çalışır.`,
  );
  say();
  showRegion('lessons/ch07#Weapons', 'Weapon sözleşmesi ve stratejiler');
  showRegion('lessons/ch07#Fighter', 'class Fighter');

  await playground(regions('lessons/ch07#Weapons', 'lessons/ch07#Fighter'), [
    { code: `const f = new Fighter('Ada', 10, new Sword());\nshow(f.attack());`, tip: 'Güç 10 + kılıç bonusu 4 = 14.' },
    { code: `const f = new Fighter('Ada', 10, new Fists());\nshow('yumruk:', f.attack());\nf.equip(new Sword());\nshow('kılıç:', f.attack());\nf.equip(new Bow());\nshow('yay:', f.attack(), f.attack());`,
      label: 'Oyun sırasında silah değiştir', tip: 'Aynı nesne, davranışı çalışırken değişti. Kalıtımla bu imkânsızdı. (Yay her 2. atışta kritik.)' },
    { code: `new Fighter('Ada', 10);`, tip: 'Bağımlılık zorunlu: silahsız Fighter doğamaz.' },
    { code: `new Fighter('Ada', 10, 'kılıç');`, tip: 'string bir Weapon değildir.' },
    { code: `const f = new Fighter('Ada', 10, { name: 'Sopa', damage: (p: number) => p + 1 });\nshow(f.attack());`, label: 'Hiç sınıf yazmadan, bir nesne literaliyle silah',
      tip: 'Weapon bir interface olduğu için şekli uyan her şey silah olabilir (test için sahte silahlar yazmak çok kolay).' },
    { code: `const f = new Fighter('Ada', 10, new Sword());\nshow(f.weapon);`, tip: 'Parça private: dışarıdan equip() ile değiştirilir (kapsülleme + kompozisyon).' },
  ], { need: 4, header: 'KOMPOZİSYON LABORATUVARI' });

  await pause('Şimdi kahramanına silah tak →');
  showRegion('model#Weapons', 'oyunun silahları (hepsi Weapon)');
  const player = await ensurePlayer();
  const weapons: Weapon[] = [new Fists(), new Sword(), new Bow(), new Staff()];
  quest('Silahını seç!');
  const idx = await choose('', weapons.map((w) => `${w.name.padEnd(7)} – ${w.info}`));
  const cls = player.constructor.name;
  const ctor = weapons[idx].constructor.name;
  say();
  await attempt(wholeModel(), [
    `const hero = new ${cls}('${player.name}');`,
    `const dummy = new Skeleton('Kukla');`,
    `show('silahsız:', hero.attack(dummy));`,
    `hero.weapon = new ${ctor}();        // KOMPOZİSYON: parçayı tak`,
    `show('silahlı :', hero.attack(dummy));`,
  ].join('\n'));
  player.weapon = weapons[idx];
  if (session.playerSpec) { session.playerSpec.weapon = ctor; saveProgress(); }
  tip(`Character.attack() içinde ${code('this.weapon.strike(this.power)')} var: karakter silahın TÜRÜNÜ bilmiyor, sadece Weapon sözleşmesini biliyor.`);
  say(paint('green', `✔ ${player.name} artık ${weapons[idx].name} kuşandı (final savaşında geçerli).`));

  await quiz('c7q1', 'Hangisi has-a (kompozisyon) ilişkisidir?', 'Warrior ve Sword: Savaşçının kılıcı vardır', ['Warrior ve Character: Savaşçı bir karakterdir', 'Dragon ve Enemy: Ejderha bir düşmandır'],
    'Is-a için extends, has-a için alan (field) kullanırız.');
  await quiz('c7q2', 'Silahları kalıtımla (FireSwordKnight …) çözmenin en büyük sorunu nedir?', 'Sınıf sayısı patlar ve silah çalışma anında değiştirilemez', ['Kod daha yavaş çalışır', 'TypeScript buna izin vermez'],
    'Kompozisyonda parça nesne değiştirilebilir, kombinasyonlar çarpılmak yerine toplanır.');
  await quiz('c7q3', 'Fighter silahı constructor parametresi olarak alıyor. Bu neyi sağlar?', 'Fighter hiçbir somut silaha bağımlı kalmaz; her Weapon ile çalışır', ['Silahı private yapar', 'Silahın hasarını artırır'],
    'Dependency injection: bağımlılığı içeride yaratmak yerine dışarıdan vermek.');
  markDone(7);
}
