/**
 * 🎮 OYUNUN GERÇEK MODELİ
 *
 * Bölümlerde ekranda gördüğün kodların çoğu `// #region` bloklarıyla BURADAN okunur,
 * final savaşında da bu sınıflar çalışır. (Sıra önemli: bir sınıf, extends ettiği
 * sınıftan SONRA tanımlanmalıdır.)
 */

// #region Interfaces
export interface Healable {                  // "iyileştirilebilir" rolü
  readonly name: string;
  readonly maxHp: number;
  heal(amount: number): number;
}
export interface HealSource {                // "iyileştirebilen" rolü
  readonly name: string;
  use(target: Healable): string;
}
export interface Weapon {                    // saldırı gücünü hesaplama stratejisi
  readonly name: string;
  readonly info: string;
  strike(basePower: number): number;
}
export interface Logger {                    // olay yazma soyutlaması
  log(message: string): void;
}
// #endregion

// #region Weapons
export class Fists implements Weapon {
  readonly name = 'Yumruk';
  readonly info = 'ek hasar yok';
  strike(basePower: number): number { return basePower; }
}
export class Sword implements Weapon {
  readonly name = 'Kılıç';
  readonly info = '+4 sabit hasar';
  strike(basePower: number): number { return basePower + 4; }
}
export class Bow implements Weapon {
  readonly name = 'Yay';
  readonly info = 'her 3. atış kritik (x2)';
  private shots = 0;
  strike(basePower: number): number {
    this.shots++;
    return this.shots % 3 === 0 ? basePower * 2 : basePower;
  }
}
export class Staff implements Weapon {
  readonly name = 'Asa';
  readonly info = '%40 fazla hasar';
  strike(basePower: number): number { return Math.round(basePower * 1.4); }
}
// #endregion

// #region Character
export class Character implements Healable {
  static readonly MAX_ENERGY = 3;                 // sınıfa ait sabit
  static #created = 0;                            // sınıfa ait sayaç
  static get created(): number { return Character.#created; }

  readonly name: string;                          // değişmez kimlik
  power: number;
  weapon: Weapon = new Fists();                   // KOMPOZİSYON: karakterin silahı VAR

  #hp: number;                                    // kapsülleme: gerçek private
  #maxHp: number;
  #energy = 1;

  constructor(name: string, maxHp: number, power: number) {
    this.name = name;
    this.power = power;
    this.#maxHp = maxHp;
    this.#hp = maxHp;
    Character.#created++;
  }

  get hp(): number { return this.#hp; }           // sadece okuma
  get maxHp(): number { return this.#maxHp; }
  get energy(): number { return this.#energy; }
  get isAlive(): boolean { return this.#hp > 0; }

  takeDamage(amount: number): number {            // canı değiştirmenin kurallı yolu
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Hasar negatif olamaz!');
    const real = Math.min(this.#hp, Math.round(amount));
    this.#hp -= real;
    return real;
  }
  heal(amount: number): number {
    const real = Math.min(this.#maxHp - this.#hp, Math.round(amount));
    this.#hp += real;
    return real;
  }
  gainEnergy(): void { this.#energy = Math.min(Character.MAX_ENERGY, this.#energy + 1); }
  spendEnergy(): boolean {
    if (this.#energy < 1) return false;
    this.#energy--;
    return true;
  }

  attack(target: Character): string {             // hedefin TÜRÜNÜ bilmiyor
    const dealt = target.takeDamage(this.weapon.strike(this.power));
    return `${this.name} → ${target.name}: ${dealt} hasar`;
  }
  special(foes: Character[]): string {            // alt sınıflar ezebilir
    const target = this.firstAlive(foes);
    return target ? this.attack(target) : 'Hedef kalmadı.';
  }
  protected firstAlive(foes: Character[]): Character | undefined {
    return foes.find((f) => f.isAlive);
  }
}
// #endregion

// #region Heroes
export class Warrior extends Character {
  readonly armor = 2;
  constructor(name: string) { super(name, 120, 14); }
  override takeDamage(amount: number): number {   // zırh hasarı azaltır
    return super.takeDamage(Math.max(1, amount - this.armor));
  }
  override special(foes: Character[]): string {
    const t = this.firstAlive(foes);
    if (!t) return 'Hedef kalmadı.';
    const dealt = t.takeDamage(this.weapon.strike(this.power) * 2);
    const recoil = this.takeDamage(8);
    return `🔥 ${this.name} ÖFKE SALDIRISI! ${t.name}: ${dealt} hasar (geri tepme: ${recoil})`;
  }
}

export class Mage extends Character {
  readonly element = 'ateş';
  constructor(name: string) { super(name, 80, 16); }
  override special(foes: Character[]): string {
    const hits = foes
      .filter((f) => f.isAlive)
      .map((f) => `${f.name} -${f.takeDamage(this.weapon.strike(this.power) * 0.8)}`);
    return `☄️  ${this.name} ATEŞ TOPU! ${hits.join(', ')}`;
  }
}

export class Archer extends Character {
  constructor(name: string) { super(name, 95, 15); }
  override special(foes: Character[]): string {
    const log: string[] = [];
    for (let i = 0; i < 2; i++) {
      const t = this.firstAlive(foes);
      if (t) log.push(`${t.name} -${t.takeDamage(this.weapon.strike(this.power) * 0.9)}`);
    }
    return `🏹 ${this.name} ÇİFTE OK! ${log.join(', ')}`;
  }
}
// #endregion

// #region Enemy
export abstract class Enemy extends Character {
  abstract takeTurn(hero: Character): string;     // her düşman KENDİ yolunu yazmak zorunda
}
// #endregion

// #region Enemies
export class Goblin extends Enemy {
  constructor(name = 'Goblin') { super(name, 25, 6); }
  override takeTurn(hero: Character): string {
    const a = hero.takeDamage(this.power / 2);
    const b = hero.takeDamage(this.power / 2);
    return `${this.name} iki kez dürter: ${a} + ${b} hasar`;
  }
}

export class Skeleton extends Enemy {
  constructor(name = 'İskelet') { super(name, 40, 9); }
  override takeDamage(amount: number): number {   // kemik zırhı 3 hasarı emer
    return super.takeDamage(Math.max(1, amount - 3));
  }
  override takeTurn(hero: Character): string { return this.attack(hero); }
}

export class Dragon extends Enemy {
  private turns = 0;
  constructor(name = 'Ejderha') { super(name, 80, 12); }
  override takeTurn(hero: Character): string {
    this.turns++;
    if (this.turns % 3 === 0) return `🔥 ${this.name} ATEŞ PÜSKÜRTÜR! ${hero.name}: ${hero.takeDamage(this.power * 2)} hasar`;
    return this.attack(hero);
  }
}
// #endregion

// #region Troll
export class Troll extends Enemy {
  readonly regen: number;
  constructor(name: string, maxHp: number, regen: number) {
    super(name, maxHp, 10);
    this.regen = regen;
  }
  override takeTurn(hero: Character): string {
    const healed = this.heal(this.regen);         // kendi canını yeniler
    const hit = this.attack(hero);
    return healed > 0 ? `${this.name} +${healed} can yeniler. ${hit}` : hit;
  }
}
// #endregion

// #region Factory
type EnemyMaker = (name?: string) => Enemy;

export class EnemyFactory {
  static readonly #makers = new Map<string, EnemyMaker>();

  static register(kind: string, maker: EnemyMaker): void {
    EnemyFactory.#makers.set(kind, maker);
  }
  static create(kind: string, name?: string): Enemy {
    const make = EnemyFactory.#makers.get(kind);
    if (!make) throw new Error(`Bilinmeyen düşman türü: ${kind}`);
    return make(name);
  }
  static get kinds(): string[] { return [...EnemyFactory.#makers.keys()]; }
}

EnemyFactory.register('goblin', (n) => new Goblin(n));
EnemyFactory.register('skeleton', (n) => new Skeleton(n));
EnemyFactory.register('dragon', (n) => new Dragon(n));
EnemyFactory.register('troll', (n) => new Troll(n ?? 'Troll', 60, 4));   // Troll'ü eklemek = 1 satır
// #endregion

// #region Items
export class Potion implements HealSource {
  readonly name = 'İksir';
  #uses: number;
  constructor(uses = 2) { this.#uses = uses; }
  get uses(): number { return this.#uses; }
  use(target: Healable): string {
    if (this.#uses < 1) return '🧪 İksir şişesi boş!';
    this.#uses--;
    return `🧪 ${target.name} iksir içti: +${target.heal(35)} can (kalan: ${this.#uses})`;
  }
}

export class Campfire implements HealSource {
  readonly name = 'Kamp ateşi';
  use(target: Healable): string {
    return `🏕️  ${target.name} kamp ateşinde dinlendi: +${target.heal(target.maxHp * 0.4)} can`;
  }
}
// #endregion

// #region Loggers
export class ConsoleLogger implements Logger {
  log(message: string): void { console.log('  ' + message); }
}
export class MemoryLogger implements Logger {
  readonly lines: string[] = [];
  log(message: string): void { this.lines.push(message); }
}
// #endregion

// #region Battle
export class Battle {
  private readonly hero: Character;
  private readonly foes: Enemy[];
  private readonly logger: Logger;           // somut sınıfa değil SÖZLEŞMEYE bağımlı

  constructor(hero: Character, foes: Enemy[], logger: Logger) {
    this.hero = hero;
    this.foes = foes;
    this.logger = logger;
  }

  get won(): boolean { return this.foes.every((f) => !f.isAlive); }
  get lost(): boolean { return !this.hero.isAlive; }
  get over(): boolean { return this.won || this.lost; }
  get livingFoes(): Enemy[] { return this.foes.filter((f) => f.isAlive); }

  heroAttack(target: Enemy): void {
    this.logger.log(this.hero.attack(target));
    this.hero.gainEnergy();
  }
  heroSpecial(): boolean {
    if (!this.hero.spendEnergy()) return false;
    this.logger.log(this.hero.special(this.foes));
    return true;
  }
  heroUse(source: HealSource): void {
    this.logger.log(source.use(this.hero));
  }
  foesAct(): void {                          // Enemy[] üzerinde polimorfik döngü
    for (const foe of this.foes) {
      if (!foe.isAlive) continue;
      this.logger.log(foe.takeTurn(this.hero));
      if (this.lost) return;
    }
  }
}
// #endregion
