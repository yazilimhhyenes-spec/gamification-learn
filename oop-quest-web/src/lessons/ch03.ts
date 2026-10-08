export {};

// #region Unit
class Unit {
  readonly name: string;
  protected hp: number;                   // protected: alt sınıflar görür, dışarısı görmez

  constructor(name: string, hp: number) {
    this.name = name;
    this.hp = hp;
  }
  get health(): number { return this.hp; }
  describe(): string { return `${this.name} (${this.hp} can)`; }
}
// #endregion

// #region Knight
class Knight extends Unit {
  armor: number;                          // sadece Knight'a özel alan

  constructor(name: string) {
    super(name, 120);                     // ÖNCE üst sınıf kurulur
    this.armor = 5;
  }
  guard(): string {
    this.hp += 5;                         // protected → alt sınıf erişebilir
    return `${this.name} savunmaya geçti (can: ${this.hp})`;
  }
}
// #endregion

// #region Wizard
class Wizard extends Unit {
  constructor(name: string) { super(name, 70); }
}
// #endregion
