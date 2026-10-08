# ⚔️ OOP Quest — tarayıcıda oynanan 2D OOP öğretici RPG

TypeScript ile yazılmış, tarayıcıda çalışan 2D bir oyun. Haritada yürüyüp bölüm binalarına girer, Bilge'den OOP'yi öğrenir, kodu **gerçek TypeScript derleyicisiyle** dener ve final savaşında her şeyi bir arada kullanırsın.

## Çalıştırma

```bash
npm install
npm run dev        # → http://127.0.0.1:5173
npm run build      # üretim derlemesi (dist/)
npm run preview    # derlenmiş sürümü http://127.0.0.1:4173 adresinde aç
```

Gereksinim: Node.js 18+ ve modern bir tarayıcı. İlerleme tarayıcının `localStorage`'ında saklanır (sağ üstteki ♻️ ile sıfırlanır).

## Nasıl oynanır?

- 🗺️ **Harita:** `W A S D` / oklarla yürü. Bir binaya **tıkla** ya da kapısına gelip **E** bas. `Esc` haritaya döndürür.
- 🧙 **Bölümler:** Bilge anlatır, kod kartlarını okursun, laboratuvar kartlarında kodu denersin, sınav sorularını çözersin (ilk denemede 3 XP, sonra 1 XP).
- ⚔️ **Bölüm 11:** Hepsini kullandığın 2D final savaşı (4 dalga). Çıkan 💡 notlar hangi OOP kavramının devrede olduğunu söyler.
- 🔮 **Rün Laboratuvarı:** Oyunun gerçek sınıflarıyla (Warrior, Goblin, Battle, EnemyFactory …) kendi kodunu yaz. `class Vampire extends Enemy …` yazıp `EnemyFactory`'ye kaydet.
- 📖 **Sözlük:** Tüm kavramlar, aranabilir.

## Bölümler

| # | Bölüm | Kavramlar |
|---|-------|-----------|
| 1 | Class & Object | class, object, field, method, constructor, `this`, referans, tip güvenliği |
| 2 | Encapsulation | `private`, `#private`, `readonly`, getter/setter |
| 3 | Inheritance | `extends`, `super`, `protected`, is-a, prototype zinciri |
| 4 | Polymorphism | `override`, dynamic dispatch, `instanceof` ile tip daraltma |
| 5 | Abstraction | `abstract class`, Template Method |
| 6 | Interfaces | `interface`, `implements`, yapısal tipleme |
| 7 | Composition | has-a, Strategy, dependency injection |
| 8 | Static & Overloading | `static`, fabrika metodu, overload |
| 9 | SOLID I | SRP, Açık/Kapalı, **Troll atölyesi** |
| 10 | SOLID II | Liskov, ISP, Dependency Inversion |
| 11 | Final Savaşı | hepsi bir arada |

## Nasıl çalışıyor?

- **Görseller:** Tüm karakterler, düşmanlar, harita ve sahneler canvas ile kodla çizilir (`src/art.ts`, `src/world.ts`, `src/scene.ts`, `src/battleview.ts`). Dış resim dosyası yok.
- **Gösterilen kod = gerçek kod:** Ekrandaki kodlar `src/model.ts` ve `src/lessons/*.ts` dosyalarından `// #region Ad … // #endregion` bloklarıyla okunur.
- **Gerçek derleyici tarayıcıda:** `src/compiler.ts`, `typescript` paketini ilk laboratuvar kullanımında tembel yükler (≈1 MB gzip). Denediğin kod derlenir; hata varsa gerçek `TSxxxx` mesajı Türkçe açıklamasıyla gösterilir, yoksa kod bir Web Worker'da çalışır (sonsuz döngüye karşı 1.5 sn zaman aşımı).
- **Oyunun modeli:** `src/model.ts` (Character, Enemy, Weapon, Battle …) hem öğretide gösterilir hem de savaşta gerçekten çalışır.

## Dosya yapısı

```
index.html
src/
  main.ts          uygulama: harita ↔ bölüm geçişi, HUD, modallar
  world.ts         2D harita (yürüme, çarpışma, binalar)
  scene.ts         bölüm sahneleri (temalı arka plan + Bilge + kahraman)
  battleview.ts    final savaşı sahnesi
  art.ts           canvas ile çizilen karakterler/düşmanlar
  stage.ts         canvas döngüsü + efektler (konfeti, yüzen yazılar)
  ui.ts            öğretici akışı: konuşma/kod/sınav/seçim kartları
  lab.ts           laboratuvar arayüzü   compiler.ts  TS derleyici + çalıştırıcı
  model.ts         oyunun gerçek sınıfları
  lessons/         bölümlerde gösterilen küçük öğretici sınıflar
  chapters/        bölüm betikleri (anlatım → laboratuvar → sınav)
```
