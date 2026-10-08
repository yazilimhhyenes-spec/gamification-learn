#!/usr/bin/env node
'use strict';
/**
 * ⚔️  OOP QUEST — Nesne Yönelimli Programlamayı Oynayarak Öğren
 *
 * Çalıştır:   node oop-quest.js
 * Bölüme atla: node oop-quest.js 3     (1-4 arası)
 *
 * Bu dosyadaki sınıflar OYUNUN GERÇEK SINIFLARIDIR. Ekranda gördüğün kodlar
 * Class.toString() ile doğrudan buradan okunur; yani gösterilen kod = çalışan kod.
 */
const readline = require('readline');
const util = require('util');

/* ════════════════════════════════════════════════════════════════════════
   1) KONSOL ARAYÜZ YARDIMCILARI (OOP ile ilgisi yok, geçebilirsin)
   ════════════════════════════════════════════════════════════════════════ */
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const paint = (c, t) => C[c] + t + C.reset;
const FAST = !!process.env.FAST;
const sleep = (ms) => (FAST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const say = (t = '') => console.log(t);
const rule = (ch = '─') => say(paint('gray', ch.repeat(64)));

// Satır kuyruğu: hem terminalde hem pipe ile verilen girdide güvenilir çalışır
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = [];
let waiter = null;
let closed = false;
rl.on('line', (l) => (waiter ? ((w) => { waiter = null; w(l); })(waiter) : lines.push(l)));
rl.on('close', () => { closed = true; if (waiter) waiter(null); });
rl.on('SIGINT', () => { say(paint('yellow', '\n\nGörüşürüz, kahraman! 👋')); process.exit(0); });

function ask(q) {
  process.stdout.write(q);
  return new Promise((res) => {
    const done = (v) => {
      if (v === null) { say(paint('yellow', '\n\nGörüşürüz, kahraman! 👋')); process.exit(0); }
      res(v.trim());
    };
    if (lines.length) done(lines.shift());
    else if (closed) done(null);
    else waiter = done;
  });
}
const pause = (msg = 'Devam etmek için Enter…') => ask(paint('gray', `\n  ⏎  ${msg} `));

async function choose(prompt, options) {
  say(prompt);
  options.forEach((o, i) => say(`   ${paint('yellow', i + 1 + ')')} ${o}`));
  for (;;) {
    const n = parseInt(await ask(paint('cyan', '  > ')), 10);
    if (n >= 1 && n <= options.length) return n - 1;
    say(paint('red', `  1 ile ${options.length} arasında bir sayı gir.`));
  }
}
async function askNumber(prompt, min, max, def) {
  for (;;) {
    const raw = await ask(paint('cyan', `${prompt} (${min}-${max}) [${def}]: `));
    if (raw === '') return def;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= min && n <= max) return n;
    say(paint('red', `  ${min} ile ${max} arasında tam sayı gir.`));
  }
}

function title(text) {
  say();
  say(paint('magenta', '╔' + '═'.repeat(62) + '╗'));
  say(paint('magenta', '║ ') + paint('bold', text.padEnd(61)) + paint('magenta', '║'));
  say(paint('magenta', '╚' + '═'.repeat(62) + '╝'));
}
async function teach(...paragraphs) {
  for (const p of paragraphs) {
    say(paint('green', '  📘 ') + p);
    await sleep(250);
  }
}
const tip = (t) => say(paint('yellow', '  💡 ') + t);

// Kod bloğunu renklendirerek yazdırır
function highlight(line) {
  const i = line.indexOf('//');
  let code = i >= 0 ? line.slice(0, i) : line;
  const comment = i >= 0 ? paint('gray', line.slice(i)) : '';
  code = code
    .replace(/\b(class|extends|super|constructor|new|return|get|set|this|const|let|if|for|of|throw|static)\b/g, (m) => paint('cyan', m))
    .replace(/#\w+/g, (m) => paint('magenta', m))
    .replace(/'[^']*'/g, (m) => paint('green', m));
  return code + comment;
}
function showCode(src, label = 'KOD') {
  const ls = src.split('\n');
  const indents = ls.slice(1).filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  const out = ls.map((l, i) => (i === 0 ? l : l.slice(cut)));
  say(paint('gray', `  ┌─ ${label} ${'─'.repeat(Math.max(0, 56 - label.length))}`));
  out.forEach((l) => say(paint('gray', '  │ ') + highlight(l)));
  say(paint('gray', '  └' + '─'.repeat(60)));
}
// Gerçekten çalıştırılan ifadeyi ve sonucunu gösterir
function run(label, fn) {
  say(paint('gray', '  ▶ ') + paint('cyan', label));
  try {
    const r = fn();
    if (r !== undefined) say(paint('green', '    ⇒ ') + (typeof r === 'string' ? r : util.inspect(r, { colors: true })));
  } catch (e) {
    say(paint('red', `    ✖ ${e.name}: `) + e.message);
  }
}
const bar = (hp, max, w = 16) => {
  const f = Math.round((hp / max) * w);
  const color = hp / max > 0.5 ? 'green' : hp / max > 0.25 ? 'yellow' : 'red';
  return paint(color, '█'.repeat(f)) + paint('gray', '░'.repeat(w - f));
};

/* ── Mini sınav sistemi ── */
let xp = 0;
let questionCount = 0;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
async function quiz(question, correct, wrongs, explain) {
  questionCount++;
  const opts = shuffle([correct, ...wrongs]);
  const answer = opts.indexOf(correct);
  say();
  say(paint('bold', '  ❓ ' + question));
  let tries = 0;
  for (;;) {
    const n = (await choose('', opts)) ;
    tries++;
    if (n === answer) {
      const gain = tries === 1 ? 3 : 1;
      xp += gain;
      say(paint('green', `  ✔ Doğru! +${gain} XP`) + paint('gray', `  (toplam ${xp})`));
      say(paint('gray', '    ' + explain));
      return;
    }
    say(paint('red', '  ✖ Olmadı, bir daha düşün…'));
  }
}

/* ════════════════════════════════════════════════════════════════════════
   2) OYUNUN GERÇEK SINIFLARI
      Bölüm 3 ve 4 bunları ekranda gösterir ve çalıştırır.
   ════════════════════════════════════════════════════════════════════════ */

// 🧱 TEMEL SINIF — Character (Encapsulation: #hp, #maxHp, #energy dışarıdan erişilemez)
class Character {
  #hp;
  #maxHp;
  #energy = 1;                       // özel yetenek için enerji

  constructor(name, maxHp, power) {
    this.name = name;                // public alan: serbestçe okunur
    this.power = power;
    this.#maxHp = maxHp;             // private alan: sadece sınıfın içinden
    this.#hp = maxHp;
  }

  get hp() { return this.#hp; }      // sadece OKUMA izni (setter yok)
  get maxHp() { return this.#maxHp; }
  get energy() { return this.#energy; }
  get isAlive() { return this.#hp > 0; }

  takeDamage(amount) {               // hp'yi değiştirmenin TEK kurallı yolu
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Hasar negatif olamaz!');
    const real = Math.min(this.#hp, Math.round(amount));
    this.#hp -= real;
    return real;                     // gerçekte verilen hasar
  }
  heal(amount) {
    const real = Math.min(this.#maxHp - this.#hp, Math.round(amount));
    this.#hp += real;
    return real;
  }
  gainEnergy() { this.#energy = Math.min(3, this.#energy + 1); }
  spendEnergy() {
    if (this.#energy < 1) return false;
    this.#energy--;
    return true;
  }

  attack(target) {                   // target'ın TÜRÜNÜ bilmiyoruz, umursamıyoruz
    const dealt = target.takeDamage(this.power);
    return `${this.name} → ${target.name}: ${dealt} hasar`;
  }
  special(foes) {                    // alt sınıflar bunu ezecek (override)
    return this.attack(foes.find((f) => f.isAlive));
  }
}

// 🛡️ KALITIM — extends: Warrior "bir Character'dır"
class Warrior extends Character {
  constructor(name) {
    super(name, 120, 14);            // üst sınıfın constructor'ını çağır
    this.armor = 2;                  // sadece Warrior'a özel alan
  }
  takeDamage(amount) {               // OVERRIDE: zırh hasarı azaltır
    return super.takeDamage(Math.max(1, amount - this.armor)); // ortak mantık super'da
  }
  special(foes) {
    const t = foes.find((f) => f.isAlive);
    const dealt = t.takeDamage(this.power * 2);
    const recoil = this.takeDamage(8);
    return `🔥 ${this.name} ÖFKE SALDIRISI! ${t.name}: ${dealt} hasar (geri tepme: ${recoil})`;
  }
}

class Mage extends Character {
  constructor(name) {
    super(name, 80, 16);
    this.element = 'ateş';
  }
  special(foes) {
    const hits = foes.filter((f) => f.isAlive).map((f) => `${f.name} -${f.takeDamage(this.power * 0.8)}`);
    return `☄️  ${this.name} ATEŞ TOPU! Herkese: ${hits.join(', ')}`;
  }
}

class Archer extends Character {
  constructor(name) {
    super(name, 95, 15);
    this.arrows = Infinity;
  }
  special(foes) {
    const log = [];
    for (let i = 0; i < 2; i++) {
      const t = foes.find((f) => f.isAlive);
      if (t) log.push(`${t.name} -${t.takeDamage(this.power * 0.9)}`);
    }
    return `🏹 ${this.name} ÇİFTE OK! ${log.join(', ')}`;
  }
}

// 👹 DÜŞMANLAR — hepsi Enemy'dir, ama takeTurn() her birinde FARKLI çalışır (polimorfizm)
class Enemy extends Character {
  takeTurn(hero) {                   // varsayılan davranış
    return this.attack(hero);
  }
}

class Goblin extends Enemy {
  constructor(name = 'Goblin') { super(name, 25, 6); }
  takeTurn(hero) {                   // OVERRIDE: iki küçük vuruş
    const a = hero.takeDamage(this.power / 2);
    const b = hero.takeDamage(this.power / 2);
    return `${this.name} iki kez dürter: ${a} + ${b} hasar`;
  }
}

class Skeleton extends Enemy {
  constructor(name = 'İskelet') { super(name, 40, 9); }
  takeDamage(amount) {               // OVERRIDE: kemik zırhı 3 hasarı emer
    return super.takeDamage(Math.max(1, amount - 3));
  }
  // takeTurn yok → Enemy'den miras alınan varsayılan davranış kullanılır
}

class Dragon extends Enemy {
  turns = 0;
  constructor(name = 'Ejderha') { super(name, 80, 12); }
  takeTurn(hero) {                   // OVERRIDE: her 3. turda ateş püskürtür
    this.turns++;
    if (this.turns % 3 === 0) return `🔥 ${this.name} ATEŞ PÜSKÜRTÜR! ${hero.name}: ${hero.takeDamage(this.power * 2)} hasar`;
    return this.attack(hero);
  }
}

/* ════════════════════════════════════════════════════════════════════════
   3) BÖLÜMLER
   ════════════════════════════════════════════════════════════════════════ */

async function intro() {
  say(paint('cyan', String.raw`
     ___   ___  ____     ___  _   _ _____ ____ _____
    / _ \ / _ \|  _ \   / _ \| | | | ____/ ___|_   _|
   | | | | | | | |_) | | | | | | | |  _| \___ \ | |
   | |_| | |_| |  __/  | |_| | |_| | |___ ___) || |
    \___/ \___/|_|      \__\_\\___/|_____|____/ |_|
  `));
  say(paint('bold', '  Nesne Yönelimli Programlamayı oynayarak öğren!'));
  rule();
  say('  Bu oyunda 4 bölüm var, hepsi bir OOP sütunu:');
  say(`   ${paint('yellow', '1.')} Class & Object   – kalıp ve ondan üretilen nesneler`);
  say(`   ${paint('yellow', '2.')} Encapsulation    – verini koru, kuralları metot koysun`);
  say(`   ${paint('yellow', '3.')} Inheritance      – ortak özellikleri miras al`);
  say(`   ${paint('yellow', '4.')} Polymorphism     – aynı çağrı, farklı davranış (+ final savaşı!)`);
  say();
  say(paint('gray', '  Ekrandaki kodlar oyunun gerçek kodudur; yazdığın seçimler onu çalıştırır.'));
  await pause('Başlamak için Enter…');
}

/* ── BÖLÜM 1: CLASS & OBJECT ───────────────────────────────────────────── */
async function chapter1() {
  title('BÖLÜM 1 · CLASS & OBJECT  (Sınıf ve Nesne)');
  await teach(
    `${paint('bold', 'Class (sınıf)')} bir ${paint('yellow', 'kalıp / plandır')}. Kendisi bir kahraman değildir; kahramanın NASIL olacağını tarif eder.`,
    `${paint('bold', 'Object (nesne)')} o kalıptan ${paint('yellow', "'new'")} ile üretilen gerçek örnektir. Aynı kalıptan istediğin kadar nesne üretirsin.`,
    'Kurabiye kalıbı = class, kurabiyeler = object. Her kurabiyenin kendi şekeri, kendi çikolatası olur (state / durum).',
  );
  say();

  class Hero {
    constructor(name, hp, power) {   // nesne ilk doğarken çalışır
      this.name = name;              // alan (field / property): nesnenin verisi
      this.hp = hp;
      this.power = power;
    }
    hit(target) {                    // metot (method): nesnenin davranışı
      target.hp -= this.power;       // 'this' = metodu çağıran nesne
      return `${this.name}, ${target.name} adlı hedefe ${this.power} hasar vurdu!`;
    }
  }
  showCode(Hero.toString(), 'class Hero');
  tip('constructor: nesneyi kurar. this: "şu an konuştuğum nesne" demek.');

  say(paint('bold', '\n  🎮 GÖREV: Kendi kahramanını yarat!'));
  const name = (await ask(paint('cyan', '  Kahramanının adı [Aylin]: '))) || 'Aylin';
  const power = await askNumber('  Gücü', 5, 20, 12);
  const hp = await askNumber('  Canı', 50, 150, 100);

  say();
  run(`const hero = new Hero('${name}', ${hp}, ${power});`, () => { });
  const hero = new Hero(name, hp, power);
  run('const slime = new Hero(\'Balçık\', 40, 5);', () => { });
  const slime = new Hero('Balçık', 40, 5);
  say();
  run('console.log(hero)', () => hero);
  run('console.log(slime)', () => slime);
  tip('Aynı sınıf (Hero), iki ayrı nesne, iki ayrı durum.');

  await pause('Şimdi nesneleri vuruştur →');
  say();
  run('hero.hit(slime)', () => hero.hit(slime));
  run('slime.hp', () => slime.hp);
  run('hero.hp   // kahramanın canı etkilendi mi?', () => hero.hp);
  run('slime.hit(hero)', () => slime.hit(hero));
  run('hero.hp', () => hero.hp);
  tip('Her nesne KENDİ alanlarını taşır. hit() aynı kod, ama this farklı olduğu için sonuç farklı.');

  await quiz('Aşağıdakilerden hangisi bir NESNE (object) üretir?',
    "new Hero('Ali', 100, 10)", ['class Hero { }', 'hero.hit(slime)'],
    "'new' anahtar kelimesi sınıfın constructor'ını çalıştırıp yeni bir nesne döndürür.");
  await quiz('hero.hp = 100 iken slime.hp = 40. Bu neden mümkün?',
    'Her nesnenin kendi alan değerleri (state) vardır',
    ['Sınıf her seferinde rastgele hp verir', 'hp alanı sınıfın tek bir ortak değişkenidir'],
    'Sınıf yalnızca alanların adını/şeklini tarif eder; değerler nesne başına saklanır.');
}

/* ── BÖLÜM 2: ENCAPSULATION ────────────────────────────────────────────── */
async function chapter2() {
  title('BÖLÜM 2 · ENCAPSULATION  (Kapsülleme)');
  await teach(
    `Bölüm 1'deki Hero'nun bir sorunu var: ${paint('red', 'hp herkese açık')}. Kodun herhangi bir yeri canı istediği gibi bozabilir.`,
  );
  class Hero { constructor(n, hp) { this.name = n; this.hp = hp; } }
  const cheater = new Hero('Hileci', 100);
  say();
  run('const hero = new Hero(\'Hileci\', 100);', () => { });
  run('hero.hp = 9999;   // ⚠️ kural yok!', () => { cheater.hp = 9999; return cheater.hp; });
  run('hero.hp = -50;    // ⚠️ negatif can?!', () => { cheater.hp = -50; return cheater.hp; });
  say();
  await teach(
    `${paint('bold', 'Encapsulation')} = verileri (${paint('magenta', '#private')}) sınıfın içine gizlemek ve değişimi ${paint('yellow', 'kuralları olan metotlara')} bırakmak.`,
    'Araba örneği: motorun içine elini sokmazsın; pedala basarsın. Pedal, arabanın "public arayüzü"dür.',
  );
  say();

  class SafeHero {
    #hp;                             // # = private: dışarıdan erişilemez
    #maxHp;
    constructor(name, maxHp) {
      this.name = name;
      this.#maxHp = maxHp;
      this.#hp = maxHp;
    }
    get hp() { return this.#hp; }    // getter: okumaya izin, yazmaya yok
    takeDamage(amount) {
      if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Hasar negatif olamaz!');
      this.#hp = Math.max(0, this.#hp - amount);   // kural: can 0'ın altına inmez
    }
    heal(amount) {
      this.#hp = Math.min(this.#maxHp, this.#hp + amount);   // kural: maxHp aşılmaz
    }
  }
  showCode(SafeHero.toString(), 'class SafeHero');

  const safe = new SafeHero('Güvenli', 100);
  say(paint('bold', '\n  🎮 GÖREV: SafeHero\'yu bozmaya çalış! (en az 3 farklı deneme yap)'));
  const tried = new Set();
  for (;;) {
    say();
    say(paint('gray', `  Şu an safe.hp = ${safe.hp}`));
    const n = await choose('  Ne denersin?', [
      'safe.hp = 9999;                 (doğrudan yazmayı dene)',
      'safe.#hp = 9999;                (private alana sız)',
      'safe.takeDamage(-500);          (negatif hasarla can kazan)',
      'safe.takeDamage(30);            (kurallı yoldan hasar ver)',
      'safe.heal(9999);                (kurallı yoldan aşırı iyileş)',
      'Tamam, anladım → devam',
    ]);
    say();
    if (n === 5) {
      if (tried.size < 3) { say(paint('red', '  Biraz daha dene! En az 3 farklı şey seç.')); continue; }
      break;
    }
    tried.add(n);
    if (n === 0) {
      run('safe.hp = 9999', () => { safe.hp = 9999; });
      tip('Setter yok → yazma reddedildi. Okumak ise serbest: safe.hp');
    } else if (n === 1) {
      // Sınıfın dışında #hp yazmak sözdizimi hatasıdır; eval ile gerçek hatayı gösteriyoruz
      run('safe.#hp = 9999', () => eval('safe.#hp = 9999'));
      tip('Private alan sınıfın dışından YAZILAMAZ bile; kod çalışmadan derleme aşamasında patlar.');
    } else if (n === 2) {
      run('safe.takeDamage(-500)', () => safe.takeDamage(-500));
      tip('Metot kendi kuralını uygular: veriyi koruyan bekçi.');
    } else if (n === 3) {
      run('safe.takeDamage(30)', () => { safe.takeDamage(30); return `hp = ${safe.hp}`; });
      tip('Kurallı yoldan değişim serbest.');
    } else {
      run('safe.heal(9999)', () => { safe.heal(9999); return `hp = ${safe.hp}   (maxHp 100\'ü aşamadı)`; });
      tip('İş kuralı (maxHp sınırı) tek yerde, metodun içinde. Kodun geri kalanı bunu bilmek zorunda değil.');
    }
  }

  await quiz('#hp alanını private yapmanın asıl amacı nedir?',
    'hp\'nin sadece takeDamage/heal gibi kuralları olan metotlarla değişmesini sağlamak',
    ['Programı daha hızlı çalıştırmak', 'hp değerini gizleyip kimsenin okumasını engellemek'],
    'Amaç gizlilik değil kontrol: geçersiz durum (negatif can, aşırı can) oluşmasın.');
  await quiz('Sınıfta sadece "get hp()" var, setter yok. safe.hp = 5 yazarsak ne olur?',
    'TypeError fırlatılır, değer değişmez',
    ['hp 5 olur', 'hp sessizce sıfırlanır'],
    'Sadece getter tanımlı özellik salt-okunurdur (strict modda yazmak hata verir).');
}

/* ── BÖLÜM 3: INHERITANCE ──────────────────────────────────────────────── */
async function chapter3() {
  title('BÖLÜM 3 · INHERITANCE  (Kalıtım)');
  await teach(
    'Oyunda Savaşçı, Büyücü, Okçu var. Hepsinin adı, canı, saldırısı… ortak. Bunu 3 kez kopyalamak yerine ortak kısmı ' +
    `${paint('yellow', 'tek bir üst sınıfa')} koyarız.`,
    `${paint('bold', 'extends')} ile alt sınıf, üst sınıfın alan ve metotlarını ${paint('yellow', 'miras alır')}. Test: "Warrior bir Character'dır" cümlesi doğru mu? (is-a)`,
  );
  say();
  say(paint('gray', '  Üst sınıf (Bölüm 2\'deki kapsülleme dahil), oyunun gerçek Character sınıfı:'));
  showCode(Character.toString(), 'class Character');
  await pause();
  say();
  say(paint('gray', '  Alt sınıflardan biri: Mage'));
  showCode(Mage.toString(), 'class Mage extends Character');
  tip('super(name, 80, 16): üst sınıfın constructor\'ını çalıştırır; ortak alanlar orada kurulur.');
  tip('Mage\'e sadece FARKLI olan şeyler yazıldı: element alanı ve special(). Gerisi bedava miras!');

  say(paint('bold', '\n  🎮 GÖREV: Sınıfını seç!'));
  const kind = await choose('  Hangi kahraman?', [
    'Savaşçı (Warrior) – yüksek can, zırhlı',
    'Büyücü  (Mage)    – yüksek hasar, düşük can',
    'Okçu    (Archer)  – dengeli',
  ]);
  const name = (await ask(paint('cyan', '  Adın [Kahraman]: '))) || 'Kahraman';
  const Cls = [Warrior, Mage, Archer][kind];
  say();
  run(`const player = new ${Cls.name}('${name}');`, () => { });
  const player = new Cls(name);
  say();
  run('player instanceof ' + Cls.name, () => player instanceof Cls);
  run('player instanceof Character', () => player instanceof Character);
  for (const Other of [Warrior, Mage, Archer].filter((k) => k !== Cls)) {
    run('player instanceof ' + Other.name, () => player instanceof Other);
  }
  say();
  run('Object.keys(player)   // nesnenin kendi alanları', () => Object.keys(player));
  tip(`name, power → Character constructor'ından geldi. ${Object.keys(player).slice(2).join(', ')} → sadece ${Cls.name}'a özel. (#hp private olduğu için listede yok!)`);
  const inherited = Object.getOwnPropertyNames(Character.prototype).filter((m) => m !== 'constructor');
  run('Character\'dan miras gelen üyeler', () => inherited.join(', '));
  run('player.attack(dummy)   // attack\'i hiç yazmadık', () => player.attack(new Character('Kukla', 100, 0)));
  const chain = [];
  for (let p = Object.getPrototypeOf(player); p; p = Object.getPrototypeOf(p)) chain.push(p.constructor.name);
  run('Kalıtım zinciri', () => chain.join('  →  '));
  tip(`${Cls.name} → Character → Object. Bir üyeyi bulamazsa JS zincirde yukarı doğru arar.`);

  await quiz('class Mage ____ Character { … } — boşluğa ne gelmeli?',
    'extends', ['inherits', 'implements'], 'JavaScript\'te kalıtım "extends" ile kurulur.');
  await quiz('Alt sınıfın constructor\'ındaki super(...) çağrısı ne yapar?',
    "Üst sınıfın constructor'ını çalıştırıp ortak alanları kurar",
    ['Alt sınıfı siler', 'Üst sınıftan yeni bir nesne kopyalar'],
    "this'i kullanmadan önce super() çağrılmalıdır; yoksa JS hata verir.");
  await quiz('Hangisi doğru bir kalıtım (is-a) ilişkisidir?',
    'Warrior extends Character',
    ['Sword extends Character', 'Character extends Warrior'],
    'Kılıç bir karakter değildir (o "has-a" ilişkisi: karakterin kılıcı VARDIR). Genel olan üstte, özel olan altta olur.');
  return player;
}

/* ── BÖLÜM 4: POLYMORPHISM + FİNAL SAVAŞI ─────────────────────────────── */
async function chapter4(player) {
  title('BÖLÜM 4 · POLYMORPHISM  (Çok Biçimlilik)');
  await teach(
    `${paint('bold', 'Polymorphism')} = ${paint('yellow', 'aynı metot çağrısı')}, nesnenin gerçek türüne göre ${paint('yellow', 'farklı davranış')}.`,
    `Bunu ${paint('bold', 'override')} ile yaparız: alt sınıf, üst sınıfın metodunu kendi yoluyla yeniden yazar.`,
    'Restoranda "yemek getir" dersin; garson ne getireceğini aşçıya göre bilir. Sen aşçının kim olduğunu bilmek zorunda değilsin.',
  );
  say();
  say(paint('gray', '  Düşman sınıfları (gerçek kod):'));
  showCode(Enemy.toString(), 'class Enemy');
  showCode(Goblin.toString(), 'class Goblin extends Enemy');
  showCode(Skeleton.toString(), 'class Skeleton extends Enemy');
  showCode(Dragon.toString(), 'class Dragon extends Enemy');
  await pause('Şimdi hepsini aynı döngüde çalıştıralım →');

  say();
  say(paint('bold', '  🧪 DENEY 1: aynı satır, farklı sonuç'));
  const dummy = new Character('Kukla', 999, 0);
  const foes = [new Goblin(), new Skeleton(), new Dragon()];
  say(paint('gray', '  const foes = [new Goblin(), new Skeleton(), new Dragon()];'));
  say(paint('gray', '  for (const foe of foes) foe.takeTurn(dummy);   // 3 tur'));
  for (let round = 1; round <= 3; round++) {
    say(paint('gray', `   tur ${round}:`));
    for (const foe of foes) say('     ' + foe.takeTurn(dummy));
  }
  tip('Döngüyü yazan kod hiçbir yerde "if (foe is Dragon)" demiyor. Her nesne kendi takeTurn\'ünü biliyor.');

  say(paint('bold', '\n  🧪 DENEY 2: aynı hasar, farklı alıcılar → takeDamage(10)'));
  const targets = [new Goblin(), new Skeleton(), new Warrior('Zırhlı')];
  for (const t of targets) run(`${t.constructor.name.padEnd(8)} .takeDamage(10)`, () => `${t.takeDamage(10)} gerçek hasar`);
  tip('Skeleton ve Warrior takeDamage\'ı override etti ama ortak mantığı super.takeDamage() ile yeniden kullandı.');

  await quiz('Polymorphism en kısa nasıl tanımlanır?',
    'Aynı metot çağrısının, nesnenin gerçek türüne göre farklı davranması',
    ['Bir sınıfın birden fazla constructor\'a sahip olması', 'Verileri private yapmak'],
    'Çağıran taraf türü bilmek zorunda değildir; doğru metot çalışma anında seçilir.');
  await quiz('Skeleton\'da takeTurn yazmadık. foe.takeTurn(hero) çağrılınca ne olur?',
    'Enemy\'den miras alınan varsayılan takeTurn çalışır',
    ['Hata fırlatılır', 'Hiçbir şey olmaz'],
    'Override zorunlu değildir. Ezmezsen üst sınıfın davranışı kullanılır.');
  await quiz('Yeni bir Troll düşmanı eklemek için savaş döngüsünü değiştirmemiz gerekir mi?',
    'Hayır; Enemy\'yi extends edip takeTurn\'ü yazmak yeter',
    ['Evet, döngüye Troll için if eklenmeli', 'Evet, tüm düşmanlar baştan yazılmalı'],
    'Polimorfizmin asıl gücü: mevcut kodu bozmadan genişletebilirsin (açık/kapalı prensibi).');

  /* ── FİNAL SAVAŞI ── */
  say();
  title('⚔️  FİNAL SAVAŞI');
  await teach(
    'Şimdi hepsini bir arada göreceksin. Bu savaşta:',
    `• ${paint('bold', 'Class/Object')}: her düşman new ile üretilen bir nesne`,
    `• ${paint('bold', 'Encapsulation')}: can sadece takeDamage()/heal() ile değişir`,
    `• ${paint('bold', 'Inheritance')}: hepsi Character'ı miras alır`,
    `• ${paint('bold', 'Polymorphism')}: player.special() ve foe.takeTurn() türe göre farklı çalışır`,
  );
  await pause('Savaşa hazır mısın? Enter…');

  for (;;) {
    const hero = player; // yeniden denemede aynı nesneyi tam canla kullanırız
    hero.heal(9999);
    const won = await battle(hero);
    if (won) return hero;
    say(paint('red', '\n  💀 Yenildin… Ama gerçek bir geliştirici hatalarından öğrenir.'));
    const again = await choose('  Ne yapalım?', ['Tekrar dene (tam canla)', 'Bu kadar yeter']);
    if (again === 1) return hero;
  }
}

async function battle(hero) {
  const waves = [
    () => [new Goblin('Goblin A'), new Goblin('Goblin B')],
    () => [new Skeleton(), new Goblin('Goblin C')],
    () => [new Dragon()],
  ];
  let potions = 2;
  let shownSpecialHint = false;

  for (let w = 0; w < waves.length; w++) {
    const foes = waves[w]();
    say();
    rule('═');
    say(paint('bold', `  DALGA ${w + 1}/${waves.length}: `) + foes.map((f) => paint('red', f.name)).join(', ') + ' belirdi!');
    rule('═');
    const code = foes.map((f) => `new ${f.constructor.name}()`).join(', ');
    say(paint('gray', `  const foes = [${code}];   // hepsi Enemy ama farklı türler`));

    while (foes.some((f) => f.isAlive)) {
      say();
      say(`  ${paint('bold', hero.name)} (${hero.constructor.name})  ${bar(hero.hp, hero.maxHp)} ${hero.hp}/${hero.maxHp}   ⚡ enerji: ${'●'.repeat(hero.energy)}${'○'.repeat(3 - hero.energy)}   🧪 ${potions}`);
      for (const f of foes) {
        say(`  ${f.isAlive ? paint('red', f.name.padEnd(9)) : paint('gray', (f.name + ' †').padEnd(9))}  ${bar(f.hp, f.maxHp, 16)} ${f.hp}/${f.maxHp}`);
      }
      const alive = foes.filter((f) => f.isAlive);
      const moves = ['Saldır  → hero.attack(target)', `Özel yetenek → hero.special(foes)  ${hero.energy < 1 ? paint('gray', '(enerji yok)') : ''}`, 'İksir kullan → hero.heal(35)'];
      const m = await choose('\n  Hamlen?', moves);
      say();
      if (m === 0) {
        const target = alive.length === 1 ? alive[0] : alive[await choose('  Hedef?', alive.map((f) => f.name))];
        say('  ' + hero.attack(target));
        hero.gainEnergy();
      } else if (m === 1) {
        if (!hero.spendEnergy()) { say(paint('red', '  Enerjin yok! Saldırarak enerji kazan.')); continue; }
        say('  ' + hero.special(foes));
        if (!shownSpecialHint) {
          shownSpecialHint = true;
          tip(`hero.special(foes) tek satır. Ama sen ${hero.constructor.name} olduğun için ${hero.constructor.name}.special çalıştı. Başka sınıf seçseydin başka şey olurdu!`);
        }
      } else {
        if (potions < 1) { say(paint('red', '  İksirin kalmadı!')); continue; }
        potions--;
        say(`  🧪 ${hero.name} iksir içti: +${hero.heal(35)} can (maxHp aşılmaz → Bölüm 2 kuralı)`);
      }
      // Düşman turu: POLİMORFİZM
      for (const foe of foes.filter((f) => f.isAlive)) {
        await sleep(350);
        say(paint('red', '  ' + foe.takeTurn(hero)));    // foe Goblin mi Dragon mu? Bilmiyoruz.
        if (!hero.isAlive) return false;
      }
    }
    say(paint('green', `\n  ✔ Dalga ${w + 1} temizlendi!`));
    if (w < waves.length - 1) {
      say(`  Dinlendin: +${hero.heal(Math.round(hero.maxHp * 0.4))} can`);
      potions += 1;
      say('  Bir iksir daha buldun.');
    }
  }
  return true;
}

/* ── FİNAL: KAVRAM EŞLEŞTİRME + KARNE ──────────────────────────────────── */
async function finale() {
  title('🎓 SON SINAV: KAVRAMLARI EŞLEŞTİR');
  const concepts = ['Class', 'Object', 'Encapsulation', 'Inheritance', 'Polymorphism'];
  const items = [
    ['class Character { … }', 'Class', 'Kalıp/plan'],
    ["new Dragon('Ejderha')", 'Object', 'Kalıptan üretilen gerçek örnek'],
    ['#hp  +  takeDamage(amount)', 'Encapsulation', 'Veri gizli, değişim kurallı metotla'],
    ['class Mage extends Character', 'Inheritance', 'Ortak özellikleri üst sınıftan alma'],
    ['foe.takeTurn(hero)  → Goblin, Skeleton, Dragon farklı davranır', 'Polymorphism', 'Aynı çağrı, türe göre farklı sonuç'],
  ];
  for (const [code, right, why] of items) {
    await quiz(`Bu hangi OOP kavramını gösterir?\n     ${paint('cyan', code)}`, right, shuffle(concepts.filter((c) => c !== right)).slice(0, 2), why);
  }

  const max = questionCount * 3;
  const ratio = xp / max;
  const rank = ratio >= 0.9 ? '🏆 OOP USTASI' : ratio >= 0.65 ? '🥈 KIDEMLİ GELİŞTİRİCİ' : '🥉 ÇIRAK';
  say();
  rule('═');
  say(paint('bold', `  KARNE:  ${xp}/${max} XP   →   ${rank}`));
  rule('═');
  say(paint('gray', String.raw`
        ┌───────────────────────┐
        │  Character            │  ← Class (kalıp)
        │  #hp   #maxHp         │  ← Encapsulation (private)
        │  takeDamage() heal()  │  ← kurallı arayüz
        │  attack() special()   │
        └───────────┬───────────┘
          Inheritance│ (extends)
      ┌────────┬─────┴────┬──────────┐
   Warrior    Mage      Archer     Enemy
   special()  special() special()    │ takeTurn()
   (override) (override)(override)   ├─ Goblin   (override)
                                     ├─ Skeleton (takeDamage override)
   Her new ... = bir Object          └─ Dragon   (override)
   Aynı çağrı, farklı tür = Polymorphism`));
  say('  Artık OOP\'nin 4 sütununu hem okudun hem çalıştırdın. Sıradaki adım:');
  say('  bu dosyaya yeni bir düşman (Troll?) ekle ve savaş koduna dokunmadan oyunda çıkmasını izle. 😉');
  say();
}

/* ════════════════════════════════════════════════════════════════════════
   4) ANA AKIŞ
   ════════════════════════════════════════════════════════════════════════ */
async function main() {
  const start = parseInt(process.argv[2], 10) || 1;
  await intro();
  if (start <= 1) await chapter1();
  if (start <= 2) await chapter2();
  const player = start <= 3 ? await chapter3() : new Warrior('Kahraman');
  await chapter4(player);
  await finale();
  rl.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
