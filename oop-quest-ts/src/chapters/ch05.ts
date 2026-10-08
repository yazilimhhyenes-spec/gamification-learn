import { pause, quiz, say, teach, tip, title, b, em, code } from '../ui';
import { playground, regions, showRegion } from '../lab';
import { markDone } from '../state';

export async function chapter5(): Promise<void> {
  title('BÖLÜM 5 · ABSTRACTION  (Soyutlama)');
  await teach(
    `${b('Abstraction')} = karmaşık ayrıntıyı gizleyip ${em('sadece gerekli olanı')} göstermek. Arabada "gaz pedalı" soyuttur; enjeksiyon sistemi ayrıntıdır.`,
    `Kodda bunun aracı ${code('abstract class')}: yarım bırakılmış bir sınıf. ${em('Doğrudan nesnesi üretilemez')}; alt sınıflar boşlukları doldurmak ${em('zorundadır')}.`,
    `Oyundaki Enemy sınıfı bu yüzden abstract: "bir düşmanın takeTurn() yeteneği var" demek ama nasıl çalıştığını alt sınıfa bırakmak.`,
    `Bir de ${b('Template Method')} kalıbı var: sabit bir iskelet (${code('cast')}), değişen kısım ${code('abstract effect()')}.`,
  );
  say();
  showRegion('lessons/ch05#Spell', 'abstract class Spell');
  showRegion('lessons/ch05#Spells', 'somut alt sınıflar');

  await playground(regions('lessons/ch05#Spell', 'lessons/ch05#Spells'), [
    { code: `new Spell('Hile', 1);`, tip: 'Yarım sınıftan nesne olmaz. "Genel bir büyü" diye bir şey yok; ateş topu var, şifa var.' },
    { code: `class Lightning extends Spell { constructor() { super('Şimşek', 10); } }`, tip: 'Sözleşme: effect() yazmayan sınıf somut olamaz.' },
    { code: `show(new Fireball().cast(50));\nshow(new Fireball().cast(10));`, tip: 'cast() iskeleti mana kontrolünü yapar, effect() detayını Fireball verir.' },
    { code: `const book: Spell[] = [new Fireball(), new HealSpell()];\nfor (const s of book) show(s.cast(25));`, tip: 'Soyutlama + polimorfizm: kitap sadece Spell sözleşmesini bilir.' },
    { code: `new Fireball().effect();`, tip: 'effect() bir iç ayrıntı (protected): dışarı açılmadı.' },
    { code: `const S = Spell as any;\nconst s = new S('Hile', 1);\nshow(s.cast(5));`, tip: '😮 TS abstract\'ı derleme zamanında zorlar. any ile aşılırsa çalışma anında "effect is not a function" çöker.' },
  ], { need: 4, header: 'SOYUTLAMA LABORATUVARI' });

  await pause('Oyunun gerçek abstract sınıfı →');
  showRegion('model#Enemy', 'abstract class Enemy extends Character');
  showRegion('model#Enemies', 'Goblin, Skeleton, Dragon');
  tip('Her düşman takeTurn()\'ü KENDİ yoluyla doldurdu: Goblin iki kez dürter, Dragon her 3. turda ateş püskürtür.');

  await quiz('c5q1', 'abstract class\'tan neden nesne üretilemez?', 'Yarım kalmış bir kavramdır; abstract üyelerin gövdesi yoktur', ['Çünkü çok yavaştır', 'Çünkü constructor\'ı olamaz'],
    'Alt sınıf abstract üyeleri doldurduğunda somut sınıf olur ve new edilebilir.');
  await quiz('c5q2', 'Alt sınıf miras aldığı abstract metodu yazmazsa?', 'Derleme hatası: somut sınıf sözleşmeyi tamamlamak zorunda', ['Üst sınıfın boş metodu kullanılır', 'Çalışırken sessizce atlanır'],
    'Soyutlama, "bu işi sen yapacaksın" sözleşmesidir ve derleyici tarafından zorlanır.');
  await quiz('c5q3', 'Template Method kalıbında "sabit iskelet" ile "değişen detay" hangisidir?', 'cast() sabit iskelettir, abstract effect() değişen detaydır', ['effect() iskelet, cast() detay', 'İkisi de sabittir'],
    'Üst sınıf akışı kontrol eder, alt sınıflar sadece boşlukları doldurur.');
  markDone(5);
}
