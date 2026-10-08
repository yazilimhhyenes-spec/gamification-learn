export {};

// #region Contracts
interface Healable {                      // "iyileştirilebilir" rolü
  readonly name: string;
  heal(amount: number): number;
}
interface HealSource {                    // "iyileştirebilen" rolü
  use(target: Healable): string;
}
// #endregion

// #region Roles
class Adventurer implements Healable {
  readonly name: string;
  private hp = 50;
  constructor(name: string) { this.name = name; }
  heal(amount: number): number { this.hp += amount; return amount; }
}

class Pet implements Healable {           // Adventurer ile hiçbir akrabalığı YOK
  readonly name = 'Kedi';
  private mood = 0;
  heal(amount: number): number { this.mood += amount; return amount; }
}

class Campfire implements HealSource {
  use(target: Healable): string { return `🏕️  ${target.name}: +${target.heal(25)} can`; }
}
class Potion implements HealSource {
  private uses = 1;
  use(target: Healable): string {
    if (this.uses < 1) return 'Şişe boş!';
    this.uses--;
    return `🧪 ${target.name}: +${target.heal(35)} can`;
  }
}

class Priest implements Healable, HealSource {   // birden fazla interface = birden fazla rol
  readonly name: string;
  constructor(name: string) { this.name = name; }
  heal(amount: number): number { return amount; }
  use(target: Healable): string { return `🙏 ${this.name} → ${target.name}: +${target.heal(40)} can`; }
}
// #endregion
