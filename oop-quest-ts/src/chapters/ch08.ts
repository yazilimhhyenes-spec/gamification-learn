import { pause, quiz, say, teach, tip, title, b, em, code } from '../ui';
import { attempt, playground, regions, showRegion, wholeModel } from '../lab';
import { markDone } from '../state';

export async function chapter8(): Promise<void> {
  title('BÖLÜM 8 · STATIC & OVERLOADING');
  await teach(
    `${code('static')} üyeler ${em('nesneye değil sınıfa')} aittir: nesne üretmeden, ${code('Sınıf.üye')} ile erişilir. Hepsi nesneler arasında ${em('ortak')} tek bir kopyadır. Sabitler, sayaçlar ve ${b('fabrika metotları')} için idealdir.`,
    `${b('Overloading')} (aşırı yükleme) = aynı isimli metodun birden fazla ${em('imzası')}. (Dikkat: override ≠ overload. Override = alt sınıf ezer; overload = aynı sınıfta farklı parametre biçimleri.)`,
  );
  say();
  showRegion('lessons/ch08#SlimeStatic', 'static üyeler');
  showRegion('lessons/ch08#Overload', 'overload imzaları');
  tip('Overload\'da imzalar dışarıya görünen yüzdür; TEK bir gövde hepsini karşılar.');

  await playground(regions('lessons/ch08#SlimeStatic', 'lessons/ch08#Overload'), [
    { code: `show(Slime.MAX_HP);\nconst group = Slime.spawn(3);\nshow('canlı:', Slime.alive, 'id\\'ler:', group.map((s) => s.id));`, label: 'Sınıf adıyla erişim + fabrika metodu',
      tip: 'Nesne üretmeden Slime.MAX_HP okundu; spawn() fabrika metodu 3 nesne üretti ve sayaç ortak.' },
    { code: `Slime.spawn(2);\nSlime.spawn(3);\nshow(Slime.alive);`, tip: 'Static sayaç bütün nesneler arasında TEK ve ORTAK: 5.' },
    { code: `const s = new Slime();\nshow(s.MAX_HP);`, tip: 'static üyeye nesne üzerinden erişilmez; derleyici doğrusunu da öneriyor.' },
    { code: `Slime.MAX_HP = 5;`, tip: 'static readonly: sabit.' },
    { code: `show(Slime.#alive);`, tip: 'static #private: sayaç sınıfın dışından bozulamaz (Encapsulation sınıf düzeyinde).' },
    { code: `const w = new Wizard();\nshow(w.cast('Ateş'));\nshow(w.cast('Ateş', 3));`, tip: 'Aynı cast adı, iki farklı çağrı biçimi.' },
    { code: `new Wizard().cast('Ateş', 'üç');`, tip: 'İmzalardan hiçbirine uymayan çağrı derlenmez.' },
  ], { need: 4, header: 'STATIC & OVERLOAD LABORATUVARI' });

  await pause('Oyunun fabrikası (static + Map) →');
  showRegion('model#Factory', 'EnemyFactory');
  attempt(wholeModel(), [
    `show(EnemyFactory.kinds);`,
    `const e = EnemyFactory.create('goblin', 'Goblin A');`,
    `show(e.name, e.hp, '| şimdiye kadar yaratılan Character:', Character.created);`,
    `show('MAX_ENERGY =', Character.MAX_ENERGY);`,
  ].join('\n'));
  tip('Yeni düşman eklemek = kayıt defterine 1 satır. Savaş kodu hiç değişmez (9. bölüm).');

  await quiz('c8q1', 'static bir alan hakkında hangisi doğrudur?', 'Sınıfa aittir; bütün nesneler arasında tek ve ortaktır', ['Her nesnenin kendi kopyası vardır', 'Sadece constructor içinde okunabilir'],
    'Slime.alive gibi sayaçlar bu yüzden static yapılır.');
  await quiz('c8q2', 'Overload ile override arasındaki fark nedir?', 'Overload: aynı sınıfta aynı isim, farklı imzalar. Override: alt sınıf üst sınıfın metodunu ezer', ['İkisi aynı şeydir', 'Override sadece static metotlarda olur'],
    'Override = kalıtım + polimorfizm. Overload = aynı sınıfta kullanım kolaylığı.');
  await quiz('c8q3', 'Slime.spawn(3) gibi nesne üreten static metoda ne denir?', 'Fabrika metodu (factory method)', ['Getter', 'Destructor'], 'Nesne yaratma mantığını tek yerde toplar (EnemyFactory gibi).');
  markDone(8);
}
