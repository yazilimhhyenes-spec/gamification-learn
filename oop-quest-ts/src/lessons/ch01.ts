export {};

// #region Hero
class Hero {
  name: string;               // alan (field): nesnenin verisi — tipi string
  hp: number;
  power: number;

  constructor(name: string, hp: number, power: number) {   // nesne doğarken çalışır
    this.name = name;
    this.hp = hp;
    this.power = power;
  }

  hit(target: Hero): string {                              // metot (method): davranış
    target.hp -= this.power;                               // this = metodu çağıran nesne
    return `${this.name} → ${target.name}: ${this.power} hasar`;
  }
}
// #endregion
