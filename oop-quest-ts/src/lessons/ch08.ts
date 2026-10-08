export {};

// #region SlimeStatic
class Slime {
  static readonly MAX_HP = 30;                   // sınıfa ait sabit (nesneye değil)
  static #alive = 0;                             // sınıfa ait private sayaç

  readonly id: number;
  hp: number = Slime.MAX_HP;

  constructor() {
    Slime.#alive++;
    this.id = Slime.#alive;
  }

  static get alive(): number { return Slime.#alive; }
  static spawn(count: number): Slime[] {         // fabrika metodu
    return Array.from({ length: count }, () => new Slime());
  }
  die(): void { Slime.#alive--; }
}
// #endregion

// #region Overload
class Wizard {
  cast(spell: string): string;                   // imza 1
  cast(spell: string, times: number): string;    // imza 2
  cast(spell: string, times: number = 1): string {   // TEK gerçek gövde
    return Array(times).fill(`✨${spell}`).join(' ');
  }
}
// #endregion
