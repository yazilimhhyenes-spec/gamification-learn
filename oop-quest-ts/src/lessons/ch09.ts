export {};

// #region GodManager
class GameManager {                              // 3 ayrı sorumluluk, 1 sınıf
  hp = 100;
  saved: string[] = [];

  fight(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);             // 1) savaş kuralı
    show(`Can: ${this.hp}`);                             // 2) ekrana yazma
    this.saved.push(JSON.stringify({ hp: this.hp }));    // 3) kaydetme
  }
}
// #endregion
