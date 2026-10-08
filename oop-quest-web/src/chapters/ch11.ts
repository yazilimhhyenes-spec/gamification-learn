import { BattleView, type Backdrop } from '../battleview';
import {
  Battle, Campfire, Character, Enemy, EnemyFactory, Potion, Troll, type HealSource, type Logger,
} from '../model';
import { WEAPONS, markDone, session } from '../state';
import { esc } from '../highlight';
import { awaitUser, b, code, h, hooks, paint, pause, quest, say, sleep, teach, tip, title, append } from '../ui';
import { ensurePlayer } from './common';

/** Savaş kartındaki günlüğe yazan Logger: Battle bunu tanımaz, sadece Logger sözleşmesini bilir (DIP). */
class PanelLogger implements Logger {
  private readonly log$: HTMLElement;
  private readonly heroName: string;
  constructor(log: HTMLElement, heroName: string) { this.log$ = log; this.heroName = heroName; }
  log(message: string): void {
    const mine = new RegExp(`^[^\\p{L}]*${this.heroName}`, 'u').test(message);
    this.log$.appendChild(h('div', mine ? 'l-hero' : 'l-foe', esc(message)));
    this.log$.scrollTop = this.log$.scrollHeight;
  }
}

function makeTroll(): Enemy {
  const spec = session.troll;
  if (!spec) return EnemyFactory.create('troll');
  const t = new Troll(spec.name, spec.maxHp, spec.regen);
  t.weapon = (WEAPONS[spec.weapon] ?? WEAPONS.Fists)();
  return t;
}

const hinted = new Set<string>();
function hint(key: string, html: string): void {
  if (hinted.has(key)) return;
  hinted.add(key);
  tip(html);
}

type Action = { type: 'attack'; target: number } | { type: 'special' } | { type: 'potion' };

export async function chapter11(): Promise<void> {
  title('BÖLÜM 11 · FİNAL SAVAŞI');
  const player = await ensurePlayer();
  await teach(
    'Şimdi her şey bir arada çalışıyor. Savaş boyunca çıkan 💡 notlar hangi OOP kavramının devrede olduğunu söyleyecek:',
    `• ${b('Class/Object')}: her düşman new ile (EnemyFactory aracılığıyla) üretilir<br>• ${b('Encapsulation')}: can #private; sadece takeDamage()/heal() ile değişir<br>• ${b('Inheritance + Polymorphism')}: Character → Warrior/Mage/Archer, Enemy → Goblin/Skeleton/Dragon/Troll<br>• ${b('Abstraction + Interface')}: abstract Enemy, HealSource/Healable<br>• ${b('Composition')}: silahın Weapon nesnesi<br>• ${b('Static/Factory, OCP, DIP')}: EnemyFactory, Battle(Logger)`,
  );
  say(paint('gray', `Kahramanın: ${player.name} (${player.constructor.name}) · silahı: ${player.weapon.name}`));
  await pause('Savaşa hazırım ⚔');

  const Cls = player.constructor as new (name: string) => Character;
  const weapon = player.weapon;
  for (;;) {
    const hero = new Cls(player.name);
    hero.weapon = weapon;
    if (await campaign(hero)) break;
    quest('Yenildin… ama gerçek bir geliştirici hatalarından öğrenir. Tekrar denemek ister misin?');
    const again = await awaitUser<boolean>((done) => {
      const el = h('div', 'actions pop');
      const yes = h('button', 'btn primary', 'Tekrar dene (tam canla)');
      const no = h('button', 'btn', 'Bu kadar yeter');
      el.append(yes, no); append(el);
      yes.addEventListener('click', () => { el.remove(); done(true); });
      no.addEventListener('click', () => { el.remove(); done(false); });
    });
    if (!again) { markDone(11); return; }
  }
  say(paint('green', '🏆 ZAFER! Ejderha devrildi ve 11 bölümün tamamı senin eserin.'));
  markDone(11);
}

async function campaign(hero: Character): Promise<boolean> {
  const potion = new Potion(3);
  const camp = new Campfire();
  const waves: { name: string; back: Backdrop; make: () => Enemy[]; code: string }[] = [
    { name: 'Goblin pususu', back: 'meadow', code: `[EnemyFactory.create('goblin', 'Goblin A'), EnemyFactory.create('goblin', 'Goblin B')]`,
      make: () => [EnemyFactory.create('goblin', 'Goblin A'), EnemyFactory.create('goblin', 'Goblin B')] },
    { name: 'Mezarlık', back: 'graveyard', code: `[EnemyFactory.create('skeleton'), EnemyFactory.create('goblin', 'Goblin C')]`,
      make: () => [EnemyFactory.create('skeleton'), EnemyFactory.create('goblin', 'Goblin C')] },
    { name: 'Troll köprüsü', back: 'bridge', code: `[new Troll(...)]   // 9. bölümde SEN tasarladın`, make: () => [makeTroll()] },
    { name: 'Ejderha yuvası', back: 'volcano', code: `[EnemyFactory.create('dragon')]`, make: () => [EnemyFactory.create('dragon')] },
  ];

  for (let w = 0; w < waves.length; w++) {
    const foes = waves[w].make();
    const view = new BattleView(hero, foes, waves[w].back);
    hooks.setView(view);
    say(`<b>DALGA ${w + 1}/${waves.length} · ${esc(waves[w].name)}</b>`);
    say(paint('gray', `const foes: Enemy[] = ${waves[w].code};`));
    if (foes.some((f) => f instanceof Troll)) hint('troll', 'Bu Troll senin tasarımın. Battle sınıfı onu hiç tanımıyordu ama çalışıyor: Açık/Kapalı ilkesi.');

    const panel = h('div', 'card battle pop');
    const stat = h('div', 'b-stat');
    const log = h('div', 'b-log');
    const actions = h('div', 'b-actions');
    panel.append(h('div', 'b-head', `⚔ ${esc(waves[w].name)}`), stat, log, actions);
    append(panel);
    const battle = new Battle(hero, foes, new PanelLogger(log, hero.name));
    const everyone: Character[] = [hero, ...foes];
    const snapshot = (): number[] => everyone.map((a) => a.hp);
    const showDiff = (before: number[]): void => {
      everyone.forEach((a, i) => {
        const d = a.hp - before[i];
        if (d < 0) view.popHurt(i, String(d)); else if (d > 0) view.popHeal(i, `+${d}`);
      });
    };
    const refresh = (): void => {
      stat.innerHTML = `<span>❤ <b>${hero.hp}</b>/${hero.maxHp}</span><span>⚡ ${'●'.repeat(hero.energy)}${'○'.repeat(Character.MAX_ENERGY - hero.energy)}</span><span>🧪 ${potion.uses}</span>`;
    };
    hint('hp', 'hero.hp bir getter: okuyabilirsin ama hero.hp = 999 yazamazsın (kapsülleme).');

    const getAction = (): Promise<Action> => awaitUser<Action>((done) => {
      actions.innerHTML = '';
      refresh();
      const atk = h('button', 'btn act', '⚔ Saldır <small>hero.attack(target)</small>');
      const spc = h('button', 'btn act', `✨ Özel yetenek <small>hero.special(foes)</small>`);
      const pot = h('button', 'btn act', `🧪 İksir <small>potion.use(hero)</small>`);
      if (hero.energy < 1) spc.setAttribute('disabled', '');
      if (potion.uses < 1) pot.setAttribute('disabled', '');
      actions.append(atk, spc, pot);
      atk.addEventListener('click', () => {
        const alive = battle.livingFoes;
        if (alive.length === 1) { done({ type: 'attack', target: foes.indexOf(alive[0]) }); return; }
        actions.innerHTML = '<span class="muted">Hedef seç:</span>';
        for (const f of alive) {
          const bt = h('button', 'btn act', `🎯 ${esc(f.name)} <small>${f.hp}/${f.maxHp}</small>`);
          bt.addEventListener('click', () => done({ type: 'attack', target: foes.indexOf(f) }));
          actions.appendChild(bt);
        }
      });
      spc.addEventListener('click', () => done({ type: 'special' }));
      pot.addEventListener('click', () => done({ type: 'potion' }));
    });

    while (!battle.over) {
      const act = await getAction();
      actions.innerHTML = '<span class="muted">…</span>';
      const before = snapshot();
      if (act.type === 'attack') {
        const lunge = view.lunge(0);
        await sleep(180);
        battle.heroAttack(foes[act.target]);
        showDiff(before);
        await lunge;
        hint('attack', `hero.attack(target): hedef Goblin de olsa İskelet de, takeDamage() onun KENDİ kuralıyla çalışır (polimorfizm); hasar hero.weapon.strike() ile hesaplanır (kompozisyon).`);
      } else if (act.type === 'special') {
        view.note(0, 'ÖZEL!');
        const lunge = view.lunge(0);
        await sleep(180);
        battle.heroSpecial();
        showDiff(before);
        await lunge;
        hint('special', `hero.special(foes) tek satır ama ${code(hero.constructor.name + '.special()')} çalıştı. Başka sınıf seçseydin başka yetenek çıkardı (override).`);
      } else {
        battle.heroUse(potion as HealSource);
        showDiff(before);
        await sleep(450);
        hint('potion', 'potion.use(hero): Potion bir HealSource, hero bir Healable. İkisi birbirinin sınıfını bilmez, sadece interface sözleşmesini bilir.');
      }
      refresh();
      if (battle.won) break;
      await sleep(350);
      const b2 = snapshot();
      const lunges = foes.map((f, i) => (f.isAlive ? sleep(i * 160).then(() => view.lunge(i + 1)) : Promise.resolve()));
      await sleep(260);
      battle.foesAct();
      showDiff(b2);
      await Promise.all(lunges);
      refresh();
      hint('foes', `foe.takeTurn(hero): Goblin, İskelet, Ejderha, Troll hepsi abstract Enemy'nin takeTurn() sözleşmesini KENDİ yoluyla doldurdu. Döngü hangisinin ne yaptığını bilmiyor.`);
    }
    actions.innerHTML = '';
    refresh();
    if (battle.lost) return false;

    view.victory();
    say(paint('green', `✔ Dalga ${w + 1} temizlendi!`));
    if (w === 0) hint('static', `Şimdiye kadar yaratılan Character sayısı: ${Character.created} (static sayaç: ${code('Character.created')}).`);
    if (w < waves.length - 1) {
      const before = hero.hp;
      const msg = camp.use(hero);
      say(esc(msg));
      view.popHeal(0, `+${hero.hp - before}`);
      hint('camp', 'Campfire de bir HealSource; iksirle aynı arayüzü kullanır. Yeni bir iyileştirme kaynağı = yeni sınıf, Battle değişmez.');
      await pause('Sonraki dalga ▶');
    }
  }
  return true;
}
