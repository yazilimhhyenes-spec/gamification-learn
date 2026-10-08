export {};

// #region Weapons
interface Weapon {
  readonly name: string;
  damage(power: number): number;
}
class Fists implements Weapon {
  readonly name = 'Yumruk';
  damage(power: number): number { return power; }
}
class Sword implements Weapon {
  readonly name = 'Kılıç';
  damage(power: number): number { return power + 4; }
}
class Bow implements Weapon {
  readonly name = 'Yay';
  private shots = 0;
  damage(power: number): number {                // her 2. atış kritik
    this.shots++;
    return this.shots % 2 === 0 ? power * 2 : power;
  }
}
// #endregion

// #region Fighter
class Fighter {
  readonly name: string;
  power: number;
  private weapon: Weapon;                        // HAS-A: dövüşçünün silahı VAR

  constructor(name: string, power: number, weapon: Weapon) {   // bağımlılık dışarıdan verilir
    this.name = name;
    this.power = power;
    this.weapon = weapon;
  }
  equip(weapon: Weapon): void { this.weapon = weapon; }         // çalışma anında DEĞİŞTİRİLEBİLİR
  attack(): number { return this.weapon.damage(this.power); }
}
// #endregion
