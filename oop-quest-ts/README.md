# ⚔️ OOP Quest — TypeScript ile OOP'yi oynayarak öğren

Konsolda oynanan, 11 bölümlük öğretici RPG. Hem okuyup hem oynayarak OOP'nin temellerini ve SOLID ilkelerini öğrenirsin.

## Çalıştırma

```bash
npm install
npm start            # ana menü
npm start -- 4       # doğrudan 4. bölümden başla
npm run typecheck    # projenin kendisini tsc ile denetle
```

Gereksinim: Node.js 18+. İlerlemen `.progress.json` dosyasına kaydedilir (menüden sıfırlanabilir).

## Bölümler

| # | Bölüm | Kavramlar |
|---|-------|-----------|
| 1 | Class & Object | class, object, field, method, constructor, `this`, referans, tip güvenliği |
| 2 | Encapsulation | `private`, `#private`, `readonly`, getter/setter, invariant |
| 3 | Inheritance | `extends`, `super`, `protected`, is-a, prototype zinciri |
| 4 | Polymorphism | `override`, dynamic dispatch, tip daraltma (`instanceof`) |
| 5 | Abstraction | `abstract class`, abstract metot, Template Method |
| 6 | Interfaces | `interface`, `implements`, çoklu rol, yapısal tipleme |
| 7 | Composition | has-a, Strategy kalıbı, dependency injection |
| 8 | Static & Overloading | `static`, fabrika metodu, overload imzaları |
| 9 | SOLID I | SRP, Açık/Kapalı (OCP), **Troll atölyesi** |
| 10 | SOLID II | Liskov, ISP, Dependency Inversion |
| 11 | Final Savaşı | hepsi bir arada, 4 dalga |

Ayrıca: 🎓 Son Sınav & Karne, 🔬 Serbest Laboratuvar, 📖 Kavram Sözlüğü.

## Nasıl çalışıyor? (öğreticiliğin sırrı)

- **Gösterilen kod = gerçek kod.** Ekrandaki kodlar `// #region Ad` … `// #endregion` bloklarıyla `src/lessons/*.ts` ve `src/model.ts` dosyalarından okunur.
- **Gerçek TypeScript derleyicisi oyunun içinde.** `src/lab.ts`, oyuncunun denediği kodu `typescript` paketiyle denetler. Hata varsa gerçek `TSxxxx` mesajı (Türkçe açıklamasıyla) gösterilir; hata yoksa kod JS'e çevrilip çalıştırılır. Bu sayede "derleme hatası" ile "çalışma hatası" farkını canlı görürsün (örnek: `(safe as any).hp = 9999` derlenir ve hile çalışır; `#hp` ise aşılamaz).
- **Serbest Laboratuvar:** oyunun gerçek sınıflarıyla (Warrior, Goblin, Battle, EnemyFactory …) tek satırlık kod yaz; değişkenlerin oturum boyunca hatırlanır.

## Dosya yapısı

```
src/
  main.ts            ana menü
  model.ts           oyunun gerçek sınıfları (Character, Enemy, Battle, Weapon …)
  lessons/ch01-10    bölümlerde gösterilen küçük öğretici sınıflar
  chapters/          bölüm akışları (anlatım → laboratuvar → sınav)
  lab.ts             TS derleyici laboratuvarı + kod bölgesi okuyucu
  ui.ts, state.ts    arayüz yardımcıları, ilerleme kaydı
```

## Kendi düşmanını ekle

`src/model.ts` içine:

```ts
export class Vampire extends Enemy {
  constructor(name = 'Vampir') { super(name, 50, 11); }
  override takeTurn(hero: Character): string {
    const bite = hero.takeDamage(this.power);
    this.heal(bite);                      // ısırdıkça iyileşir
    return `🧛 ${this.name} ısırdı: ${bite} hasar, canı yenilendi`;
  }
}
EnemyFactory.register('vampire', (n) => new Vampire(n));
```

`Battle`'a hiç dokunmadan Serbest Laboratuvar'da `EnemyFactory.create('vampire')` ile çağırabilirsin. (Açık/Kapalı ilkesi!)
