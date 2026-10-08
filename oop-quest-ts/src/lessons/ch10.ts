import type { Logger } from "../model";
import { MemoryLogger } from "../model";

// #region LspBad
class Foe {
  takeTurn(): string { return 'saldırır'; }
}
class Wolf extends Foe {}
class PeacefulMonk extends Foe {
  override takeTurn(): string { throw new Error('Keşişler saldırmaz!'); }   // sözleşmeyi BOZDU
}
// #endregion

// #region LspGood
interface Attacker { takeTurn(): string; }
class Wolf2 implements Attacker {
  takeTurn(): string { return 'kurt saldırır'; }
}
class Monk {                                     // Attacker DEĞİL, kendi rolü var
  meditate(): string { return 'keşiş meditasyon yapıyor'; }
}
// #endregion

// #region IspBad
interface Creature {
  attack(): string;
  fly(): string;
  swim(): string;
}
// #endregion

// #region IspGood
interface Attacker2 { attack(): string; }
interface Flyer { fly(): string; }
interface Swimmer { swim(): string; }

class Bat implements Attacker2, Flyer {
  attack(): string { return 'ısırır'; }
  fly(): string { return 'uçar'; }
}
class Duck implements Flyer, Swimmer {
  fly(): string { return 'alçaktan uçar'; }
  swim(): string { return 'yüzer'; }
}
class Slime2 implements Attacker2 {
  attack(): string { return 'blup'; }
}
// #endregion

// #region Duel
class ShowLogger implements Logger {
  log(message: string): void { show(message); }
}

class Duel {
  private readonly logger: Logger;                    // soyutlamaya bağımlı
  constructor(logger: Logger) { this.logger = logger; }   // dışarıdan enjekte edilir
  run(): void {
    this.logger.log('⚔️  Düello başladı');
    this.logger.log('🏆 Kazanan: Ayşe');
  }
}
// #endregion

// #region Coupled
class CoupledDuel {
  private readonly logger = new MemoryLogger();      // somut sınıfa SIKI bağlı: değiştirilemez
  run(): void { this.logger.log('Düello'); }
}
// #endregion
