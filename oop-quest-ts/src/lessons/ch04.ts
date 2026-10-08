export {};

// #region Monster
class Monster {
  readonly name: string;
  constructor(name: string) { this.name = name; }
  cry(): string { return '...'; }
  takeHit(amount: number): number { return amount; }      // gerçekte alınan hasar
}

class Slime extends Monster {
  override cry(): string { return 'blup blup!'; }
}
class Wolf extends Monster {
  override cry(): string { return 'auuuu!'; }
}
class Golem extends Monster {
  override cry(): string { return 'GRRRM'; }
  override takeHit(amount: number): number {              // ezer ama super'ı da kullanır
    return Math.max(1, super.takeHit(amount) - 6);
  }
  smash(): string { return `${this.name} yeri sarstı!`; } // sadece Golem'de var
}
class Mimic extends Monster {}                            // hiçbir şeyi ezmedi
// #endregion
