import { esc } from '../highlight';
import { markDone, session, totalXp } from '../state';
import { append, code, h, hooks, quiz, shuffle, title } from '../ui';

const CONCEPTS = ['Class', 'Object', 'Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction', 'Interface', 'Composition', 'Static', 'Dependency Injection', 'Open/Closed'];

const ITEMS: [string, string, string][] = [
  ['class Character { … }', 'Class', 'Kalıp / plan'],
  ["new Dragon('Ejderha')", 'Object', 'Kalıptan üretilmiş gerçek örnek'],
  ['#hp   +   takeDamage(amount)', 'Encapsulation', 'Veri gizli, değişim kurallı metotla'],
  ['class Mage extends Character', 'Inheritance', 'Ortak özellikleri üst sınıftan miras alma'],
  ['foe.takeTurn(hero)  → Goblin ve Dragon farklı davranır', 'Polymorphism', 'Aynı çağrı, nesnenin gerçek türüne göre farklı sonuç'],
  ['abstract class Enemy { abstract takeTurn(h: Character): string }', 'Abstraction', 'Ayrıntıyı alt sınıfa bırakıp sadece sözleşmeyi göstermek'],
  ['class Potion implements HealSource', 'Interface', 'Sadece sözleşme; akrabalık gerektirmeyen rol'],
  ['hero.weapon = new Sword()', 'Composition', 'has-a: parçayı tak, çalışma anında değiştir (Strategy)'],
  ["EnemyFactory.create('goblin')   /   Character.created", 'Static', 'Sınıfa ait üye, nesne üretmeden erişilir'],
  ['new Battle(hero, foes, new MemoryLogger())', 'Dependency Injection', 'Bağımlılık (logger) dışarıdan verilir'],
  ["EnemyFactory.register('troll', …)   // Battle'a dokunmadan yeni düşman", 'Open/Closed', 'Genişlemeye açık, değişime kapalı'],
];

export async function chapterExam(): Promise<void> {
  title('🎓 SON SINAV · KAVRAMLARI EŞLEŞTİR');
  let i = 0;
  for (const [snippet, right, why] of shuffle(ITEMS)) {
    i++;
    const wrongs = shuffle(CONCEPTS.filter((c) => c !== right)).slice(0, 3);
    await quiz(`exam${ITEMS.findIndex((x) => x[1] === right)}`, `<b>(${i}/${ITEMS.length})</b> Bu hangi OOP kavramını gösterir?<br>${code(snippet)}`, right, wrongs, why);
  }
  markDone(12);
  report();
}

export function report(): void {
  const answered = Object.keys(session.answered).length;
  const xp = totalXp();
  const ratio = answered ? xp / (answered * 3) : 0;
  const rank = ratio >= 0.9 ? '🏆 OOP USTASI' : ratio >= 0.65 ? '🥈 KIDEMLİ GELİŞTİRİCİ' : '🥉 ÇIRAK';
  const doneCh = session.done.filter((n) => n <= 11).sort((a, b) => a - b);
  const diagram = `
   «interface» Healable · HealSource · Weapon · Logger
            ▲ implements
   ┌────────┴──────────────┐
   │ Character             │  ← Class        has-a → Weapon (Composition)
   │ #hp #maxHp #energy    │  ← Encapsulation
   │ static created        │  ← Static
   └────────┬──────────────┘
    extends │ (Inheritance)
   ┌───────┬┴───────┬──────────────────┐
 Warrior  Mage   Archer   «abstract» Enemy  ← Abstraction
 override override override  ├ Goblin ├ Skeleton ├ Dragon ├ Troll  (takeTurn: Polymorphism)
                             └ Battle(hero, Enemy[], Logger) ← DIP + OCP`;
  append(h('div', 'card report pop', `
    <div class="rank">${rank}</div>
    <div class="score"><b>${xp}</b> / ${answered * 3} XP <span class="muted">· ${answered} soru · bölümler: ${doneCh.join(', ') || '—'}</span></div>
    <pre class="diagram">${esc(diagram)}</pre>
    <p>OOP'nin sütunlarını ve SOLID'i hem okudun, hem derleyiciyle sınadın, hem de savaşta çalıştırdın.<br>
    Sıradaki adım: <b>Rün Laboratuvarı</b>'nda kendi düşmanını (<code>class Vampire extends Enemy …</code>) yazıp <code>EnemyFactory</code>'ye kaydet. 😉</p>`));
  hooks.correct(0);
}
