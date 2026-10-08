export {};

// #region OpenHero
class OpenHero {
  name: string;
  hp: number;                 // herkese açık: kural yok!
  constructor(name: string, hp: number) {
    this.name = name;
    this.hp = hp;
  }
}
// #endregion

// #region SafeHero
class SafeHero {
  readonly name: string;                  // sadece constructor'da atanır
  private hp: number;                     // TS private: derleyici engeller
  private readonly maxHp: number;

  constructor(name: string, maxHp: number) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  get health(): number { return this.hp; }          // getter: okuma arayüzü

  takeDamage(amount: number): void {
    if (amount < 0) throw new RangeError('Hasar negatif olamaz!');
    this.hp = Math.max(0, this.hp - amount);        // kural: can 0'ın altına inmez
  }
  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);   // kural: maxHp aşılamaz
  }
}
// #endregion

// #region HardHero
class HardHero {
  #hp = 100;                              // JS'in GERÇEK private'ı (çalışma anında da gizli)
  get health(): number { return this.#hp; }
  takeDamage(amount: number): void { this.#hp = Math.max(0, this.#hp - amount); }
}
// #endregion

// #region LevelHero
class LevelHero {
  private _level = 1;
  get level(): number { return this._level; }
  set level(value: number) {              // setter: yazarken doğrulama
    if (!Number.isInteger(value) || value < 1 || value > 99) throw new RangeError('Seviye 1-99 arası olmalı');
    this._level = value;
  }
}
// #endregion
