import {
  Battle, Bow, Campfire, Character, Enemy, EnemyFactory, Fists, Potion, Staff, Sword, Troll,
  type HealSource, type Logger, type Weapon,
} from '../model';
import { markDone, session } from '../state';
import { bar, choose, paint, pause, say, sleep, teach, tip, title, b, em, code, rule } from '../ui';
import { ensurePlayer } from './common';

/** UI tarafındaki Logger implementasyonu: Battle bunu tanımaz, sadece Logger sözleşmesini bilir (DIP). */
class ColorLogger implements Logger {
  private readonly heroName: string;
  constructor(heroName: string) { this.heroName = heroName; }
  log(message: string): void {
    const mine = new RegExp(`^[^\\p{L}]*${this.heroName}`, 'u').test(message);
    say((mine ? paint('green', '  ') : paint('red', '  ')) + message);
  }
}

const WEAPONS: Record<string, () => Weapon> = {
  Fists: () => new Fists(), Sword: () => new Sword(), Bow: () => new Bow(), Staff: () => new Staff(),
};

function makeTroll(): Enemy {
  const spec = session.troll;
  if (!spec) return EnemyFactory.create('troll');
  const t = new Troll(spec.name, spec.maxHp, spec.regen);
  t.weapon = (WEAPONS[spec.weapon] ?? WEAPONS.Fists)();
  return t;
}

const hinted = new Set<string>();
function hint(key: string, text: string): void {
  if (hinted.has(key)) return;
  hinted.add(key);
  tip(text);
}

export async function chapter11(): Promise<void> {
  title('BÖLÜM 11 · FİNAL SAVAŞI');
  const player = await ensurePlayer();
  await teach(
    'Şimdi her şey bir arada çalışıyor. Savaş boyunca ekranda çıkan 💡 notlar hangi OOP kavramının devrede olduğunu söyleyecek:',
    `• ${b('Class/Object')}: her düşman new ile (EnemyFactory aracılığıyla) üretilir`,
    `• ${b('Encapsulation')}: can #private; sadece takeDamage()/heal() ile değişir`,
    `• ${b('Inheritance + Polymorphism')}: Character → Warrior/Mage/Archer, Enemy → Goblin/Skeleton/Dragon/Troll`,
    `• ${b('Abstraction + Interface')}: abstract Enemy, HealSource/Healable sözleşmeleri`,
    `• ${b('Composition')}: silahın Weapon nesnesi`,
    `• ${b('Static/Factory')}, ${b('OCP')}, ${b('DIP')}: EnemyFactory, Battle(Logger)`,
  );
  say(paint('gray', `\n  Kahramanın: ${player.name} (${player.constructor.name})  · silahı: ${player.weapon.name}`));
  await pause('Savaşa hazır mısın? Enter…');

  const Cls = player.constructor as new (name: string) => Character;
  const weapon = player.weapon;
  for (;;) {
    const hero = new Cls(player.name);
    hero.weapon = weapon;
    if (await campaign(hero)) break;
    say(paint('red', '\n  💀 Yenildin… Ama gerçek bir geliştirici hatalarından öğrenir.'));
    if ((await choose('  Ne yapalım?', ['Tekrar dene (tam canla)', 'Bu kadar yeter'])) === 1) { markDone(11); return; }
  }
  say(paint('green', '\n  🏆 ZAFER! Ejderha devrildi ve 11 bölümün tamamı senin eserin.'));
  markDone(11);
}

async function campaign(hero: Character): Promise<boolean> {
  const potion = new Potion(3);
  const camp = new Campfire();
  const waves: { name: string; make: () => Enemy[]; code: string }[] = [
    { name: 'Goblin pususu', code: `[EnemyFactory.create('goblin', 'Goblin A'), EnemyFactory.create('goblin', 'Goblin B')]`,
      make: () => [EnemyFactory.create('goblin', 'Goblin A'), EnemyFactory.create('goblin', 'Goblin B')] },
    { name: 'Mezarlık', code: `[EnemyFactory.create('skeleton'), EnemyFactory.create('goblin', 'Goblin C')]`,
      make: () => [EnemyFactory.create('skeleton'), EnemyFactory.create('goblin', 'Goblin C')] },
    { name: 'Troll köprüsü', code: `[new Troll(...)]   // 9. bölümde SEN tasarladın`, make: () => [makeTroll()] },
    { name: 'Ejderha yuvası', code: `[EnemyFactory.create('dragon')]`, make: () => [EnemyFactory.create('dragon')] },
  ];

  for (let w = 0; w < waves.length; w++) {
    const foes = waves[w].make();
    say();
    rule('═');
    say(paint('bold', `  DALGA ${w + 1}/${waves.length} · ${waves[w].name}: `) + foes.map((f) => paint('red', f.name)).join(', '));
    rule('═');
    say(paint('gray', `  const foes: Enemy[] = ${waves[w].code};`));
    if (foes.some((f) => f instanceof Troll)) hint('troll', 'Bu Troll senin tasarımın. Battle sınıfı onu hiç tanımıyordu, ama çalışıyor: Açık/Kapalı ilkesi.');

    const battle = new Battle(hero, foes, new ColorLogger(hero.name));
    while (!battle.over) {
      say();
      say(`  ${paint('bold', hero.name)} (${hero.constructor.name}) ${bar(hero.hp, hero.maxHp)} ${hero.hp}/${hero.maxHp}   ⚡ ${'●'.repeat(hero.energy)}${'○'.repeat(Character.MAX_ENERGY - hero.energy)}   🧪 ${potion.uses}`);
      hint('hp', 'hero.hp bir getter: okuyabilirsin ama hero.hp = 999 yazamazsın (kapsülleme).');
      for (const f of foes) {
        say(`  ${f.isAlive ? paint('red', f.name.padEnd(10)) : paint('gray', (f.name + ' †').padEnd(10))} ${bar(f.hp, f.maxHp)} ${f.hp}/${f.maxHp}`);
      }
      const m = await choose('\n  Hamlen?', [
        'Saldır          → hero.attack(target)',
        `Özel yetenek    → hero.special(foes)  ${hero.energy < 1 ? paint('gray', '(enerji yok)') : ''}`,
        `İksir kullan    → potion.use(hero)    ${potion.uses < 1 ? paint('gray', '(boş)') : ''}`,
      ]);
      say();
      if (m === 0) {
        const alive = battle.livingFoes;
        const target = alive.length === 1 ? alive[0] : alive[await choose('  Hedef?', alive.map((f) => f.name))];
        battle.heroAttack(target);
        hint('attack', `hero.attack(target): hedef Goblin de olsa İskelet de, takeDamage() onun KENDİ kuralıyla çalışır (polimorfizm); hasar hero.weapon.strike() ile hesaplanır (kompozisyon).`);
      } else if (m === 1) {
        if (!battle.heroSpecial()) { say(paint('red', '  Enerjin yok! Saldırarak enerji kazan.')); continue; }
        hint('special', `hero.special(foes) tek satır ama ${hero.constructor.name}.special() çalıştı. Başka sınıf seçseydin başka yetenek çıkardı (override).`);
      } else {
        if (potion.uses < 1) { say(paint('red', '  İksirin kalmadı!')); continue; }
        battle.heroUse(potion as HealSource);
        hint('potion', 'potion.use(hero): Potion bir HealSource, hero bir Healable. İkisi birbirinin sınıfını bilmez, sadece interface sözleşmesini bilir.');
      }
      if (battle.won) break;
      await sleep(300);
      battle.foesAct();
      hint('foes', 'foe.takeTurn(hero): Goblin, İskelet, Ejderha, Troll hepsi abstract Enemy\'nin takeTurn() sözleşmesini KENDİ yoluyla doldurdu. Döngü hangisinin ne yaptığını bilmiyor.');
    }
    if (battle.lost) return false;

    say(paint('green', `\n  ✔ Dalga ${w + 1} temizlendi!`));
    if (w === 0) hint('static', `Şimdiye kadar yaratılan Character sayısı: ${Character.created} (static sayaç: Character.created).`);
    if (w < waves.length - 1) {
      say('  ' + camp.use(hero));
      hint('camp', 'Campfire de bir HealSource; iksirle aynı arayüzü kullanır. Yeni bir iyileştirme kaynağı = yeni sınıf, Battle değişmez.');
    }
  }
  return true;
}
