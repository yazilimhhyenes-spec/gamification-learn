import { pause, quiz, say, teach, tip, title, b, em, code } from '../ui';
import { attempt, playground, regions, showRegion } from '../lab';
import { markDone } from '../state';

export async function chapter2(): Promise<void> {
  title('BÖLÜM 2 · ENCAPSULATION  (Kapsülleme)');
  await teach(`Bölüm 1'deki Hero'nun bir sorunu var: ${em('hp herkese açık')}. Kodun herhangi bir yeri canı istediği gibi bozabilir.`);
  say();
  showRegion('lessons/ch02#OpenHero', 'class OpenHero');
  await attempt(regions('lessons/ch02#OpenHero'), [
    `const h = new OpenHero('Hileci', 100);`,
    `h.hp = 9999;      // ⚠️ kural yok!`,
    `show(h.hp);`,
    `h.hp = -50;       // ⚠️ negatif can?!`,
    `show(h.hp);`,
  ].join('\n'));
  say();
  await teach(
    `${b('Encapsulation')} = veriyi ${em('gizlemek')} ve değişimi ${em('kuralları olan metotlara')} bırakmak. Amaç gizlilik değil, ${em('geçersiz durumu imkânsız kılmak')} (negatif can, aşırı can).`,
    'Araba örneği: motorun içine elini sokmazsın, pedala basarsın. Pedal arabanın "public arayüzü"dür.',
    `Erişim belirleyicileri: ${code('public')} (herkes) · ${code('private')} (sadece bu sınıf) · ${code('protected')} (sınıf + alt sınıflar, 3. bölüm) · ${code('readonly')} (sadece constructor'da atanır).`,
  );
  say();
  showRegion('lessons/ch02#SafeHero', 'class SafeHero');
  tip('get health(): dışarıya sadece OKUMA penceresi açtık. Yazma yolu yok.');

  const decls = regions('lessons/ch02#SafeHero', 'lessons/ch02#HardHero');
  await playground(decls, [
    { code: `safe.hp = 9999;`, tip: 'Derleyici private alana dışarıdan yazmayı reddetti.' },
    { code: `safe.name = 'Hileci';`, tip: 'readonly: kimlik değişmez.' },
    { code: `show(safe.hp);`, tip: 'Okumak bile private için yasak. Okuma için getter (health) var.' },
    { code: `safe.takeDamage(-500);`, tip: 'Metot kendi kuralını uygular: veriyi koruyan bekçi. (Bu ÇALIŞMA zamanı hatası.)' },
    { code: `safe.takeDamage(30);\nshow('hp =', safe.health);`, tip: 'Kurallı yoldan değişim serbest.' },
    { code: `safe.heal(9999);\nshow('hp =', safe.health);`, tip: 'maxHp kuralı tek yerde (metodun içinde). Kodun geri kalanı bunu bilmek zorunda değil.' },
    { code: `(safe as any).hp = 9999;\nshow('hp =', safe.health);`, tip: '😮 DERLENDİ ve hile ÇALIŞTI! TS private sadece derleme zamanında vardır; any ile kapıyı aşabilirsin.' },
  ], { setup: `const safe = new SafeHero('Güvenli', 100);`, need: 4, header: 'SAFEHERO\'YU BOZMAYA ÇALIŞ' });

  await pause('Peki gerçek koruma yok mu? Var: JavaScript\'in #private\'ı →');
  say();
  showRegion('lessons/ch02#HardHero', 'class HardHero');
  await playground(decls, [
    { code: `h.#hp = 9999;`, tip: '#private dışarıdan yazılamaz; TS bunu derleme aşamasında reddeder.' },
    { code: `(h as any).hp = 9999;\nshow('health:', h.health);`, tip: 'any ile yeni bir "hp" alanı oluştu ama GERÇEK #hp alanına dokunamadı: can hâlâ 100.' },
    { code: `(h as any)['#hp'] = 1;\nshow(h.health);`, tip: '"#hp" bir isim değil, dil seviyesinde gizli bir yuva. String ile bulunamaz.' },
  ], { setup: `const h = new HardHero();`, need: 2, header: '#PRIVATE LABORATUVARI' });
  await teach(`${em('private')} (TS) = derleyici kuralı, ${em('#private')} (JS) = çalışma anında da geçerli gerçek gizlilik. Oyunun ana sınıfı Character ${code('#hp')} kullanır.`);

  await pause('Son olarak getter/setter →');
  say();
  showRegion('lessons/ch02#LevelHero', 'class LevelHero');
  await playground(regions('lessons/ch02#LevelHero'), [
    { code: `lv.level = 150;`, tip: 'Setter geçersiz değeri reddetti: alan gibi görünen, kural uygulayan metot.' },
    { code: `lv.level = 5;\nshow(lv.level);`, tip: 'Dışarıdan sıradan bir alan gibi kullanılır ama arkada setter çalışır.' },
    { code: `lv._level = 99;`, tip: 'Asıl alan private; sadece getter/setter üzerinden erişilir.' },
  ], { setup: `const lv = new LevelHero();`, need: 2, header: 'GETTER / SETTER' });

  await quiz('c2q1', 'Bir alanı private yapmanın asıl amacı nedir?', 'Geçersiz durumu önlemek: değişim sadece kuralları olan metotlardan geçsin',
    ['Programı daha hızlı çalıştırmak', 'Kimsenin değeri okumasını engellemek'], 'Amaç kontrol: invariant (değişmez kural) korunur. Okuma için getter açabilirsin.');
  await quiz('c2q2', 'TS "private" ile JS "#private" arasındaki temel fark nedir?', 'private sadece derleme zamanında denetlenir, #private çalışma anında da gizlidir',
    ['İkisi tamamen aynıdır', '#private sadece sayılar için çalışır'], '(safe as any).hp ile TS private aşıldı; #hp ise aşılamadı.');
  await quiz('c2q3', 'Sınıfta sadece "get health()" var. safe.health = 5 yazarsak?', 'Derleme hatası: salt-okunur özellik', ['health 5 olur', 'health sıfırlanır'],
    'Setter olmayan getter özelliği salt okunurdur.');
  await quiz('c2q4', '"readonly name" alanı nerede atanabilir?', 'Sadece constructor içinde (ve tanımlandığı satırda)', ['Her metotta', 'Hiçbir yerde'],
    'readonly: nesne doğarken belirlenir, sonra değişmez (kimlik gibi).');
  markDone(2);
}
