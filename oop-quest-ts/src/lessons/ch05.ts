export {};

// #region Spell
abstract class Spell {
  readonly name: string;
  protected readonly cost: number;

  constructor(name: string, cost: number) {
    this.name = name;
    this.cost = cost;
  }

  cast(mana: number): string {                            // sabit iskelet (Template Method)
    if (mana < this.cost) return `${this.name}: yetersiz mana (${mana}/${this.cost})`;
    return `${this.name}: ${this.effect()} (-${this.cost} mana)`;
  }

  protected abstract effect(): string;                    // detay: alt sınıf DOLDURMAK ZORUNDA
}
// #endregion

// #region Spells
class Fireball extends Spell {
  constructor() { super('Ateş Topu', 30); }
  protected override effect(): string { return '🔥 düşmanı yaktı!'; }
}
class HealSpell extends Spell {
  constructor() { super('Şifa', 20); }
  protected override effect(): string { return '💚 can yeniledi!'; }
}
// #endregion
