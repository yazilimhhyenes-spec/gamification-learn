import { pause, quiz, say, teach, tip, title, b, em, code } from '../ui';
import { attempt, playground, regions, showRegion, wholeModel } from '../lab';
import { markDone } from '../state';

export async function chapter4(): Promise<void> {
  title('BÖLÜM 4 · POLYMORPHISM  (Çok Biçimlilik)');
  await teach(
    `${b('Polymorphism')} = ${em('aynı metot çağrısı')}, nesnenin ${em('gerçek türüne')} göre ${em('farklı davranış')}.`,
    `Bunu ${b('override')} (ezme) ile yaparız: alt sınıf, üst sınıfın metodunu kendi yoluyla yeniden yazar. ${code('super.metot()')} ile üst sınıftakini de kullanabilir.`,
    'Restoranda "yemek getir" dersin; ne geleceğini aşçı belirler. Sen aşçının kim olduğunu bilmek zorunda değilsin.',
    `TS özelliği: ${code('override')} anahtar kelimesi. Yazım hatası yapıp yanlışlıkla yeni metot açmanı engeller.`,
  );
  say();
  showRegion('lessons/ch04#Monster', 'Monster ve alt sınıfları');

  await playground(regions('lessons/ch04#Monster'), [
    { code: `const zoo: Monster[] = [new Slime('Jöle'), new Wolf('Kurt'), new Golem('Taş'), new Mimic('Sandık')];\nfor (const m of zoo) show(m.name.padEnd(7), m.cry());`,
      label: 'zoo.cry()  → aynı satır, 4 farklı ses',
      tip: 'Döngü hiçbir yerde "if (m is Wolf)" demiyor. Mimic hiçbir şeyi ezmedi, üst sınıfın "..." değerini kullandı.' },
    { code: `const zoo: Monster[] = [new Slime('Jöle'), new Golem('Taş')];\nfor (const m of zoo) show(m.name, 'gerçek hasar:', m.takeHit(10));`,
      label: 'takeHit(10) → Golem farklı hasar alır',
      tip: 'Golem takeHit\'i ezdi ama super.takeHit()\'i çağırarak ortak mantığı yeniden kullandı.' },
    { code: `const m: Monster = new Golem('Taş');\nshow(m.smash());`,
      label: 'Monster tipli değişkenden smash() çağır',
      tip: 'TİP (Monster) neyi çağırabileceğini belirler; nesne Golem olsa bile derleyici bunu bilmez.' },
    { code: `const m: Monster = new Golem('Taş');\nif (m instanceof Golem) show(m.smash());`,
      label: 'instanceof ile Golem\'e daralt',
      tip: 'instanceof kontrolünden sonra TS tipi Golem\'e daraltır (type narrowing).' },
    { code: `class Rat extends Monster { cry(): string { return 'çik'; } }`,
      tip: 'Üst sınıfı eziyorsan "override" yazmak zorundasın; yanlışlıkla ezmeyi önler.' },
    { code: `class Rat extends Monster { override cryy(): string { return 'çik'; } }`,
      tip: 'Yazım hatası! "override" sayesinde derleyici üst sınıfta böyle bir metot olmadığını söyledi.' },
  ], { need: 4, header: 'POLİMORFİZM LABORATUVARI' });

  await teach(
    `${b('Statik tip vs çalışma-anı tipi')}: değişkenin tipi (Monster) derleme zamanında, nesnenin gerçek sınıfı (Golem) çalışırken belirlenir. Hangi metodun çalışacağını ${em('gerçek sınıf')} seçer (dynamic dispatch).`,
  );
  await pause('Şimdi gerçek oyun sınıfında: aynı çağrı, farklı Character →');
  say();
  attempt(wholeModel(), [
    `const targets: Character[] = [new Goblin(), new Skeleton(), new Warrior('Zırhlı')];`,
    `for (const t of targets) show(t.name.padEnd(8), 'takeDamage(10) →', t.takeDamage(10), 'gerçek hasar');`,
  ].join('\n'));
  tip('Character.attack() hedefin TÜRÜNÜ bilmeden target.takeDamage() çağırır; Skeleton ve Warrior kendi zırhlarını uygular.');

  await quiz('c4q1', 'Polymorphism en kısa nasıl tanımlanır?', 'Aynı metot çağrısının, nesnenin gerçek türüne göre farklı davranması',
    ["Bir sınıfın birden fazla constructor'ı olması", 'Verileri private yapmak'], 'Çağıran taraf türü bilmek zorunda değil; doğru metot çalışırken seçilir.');
  await quiz('c4q2', 'Mimic hiçbir metodu ezmedi. mimic.cry() çağrılınca ne olur?', "Monster'ın (üst sınıf) cry() metodu çalışır", ['Hata fırlatılır', 'Hiçbir şey olmaz'],
    'Override zorunlu değil. Ezmezsen üst sınıfın davranışı kullanılır.');
  await quiz('c4q3', '"override" anahtar kelimesinin faydası nedir?', 'Üst sınıfta olmayan bir metodu yanlışlıkla ezmeye çalışırsak derleyici uyarır',
    ['Metodu daha hızlı çalıştırır', 'Metodu private yapar'], 'Yazım hatalarını (cryy gibi) ve üst sınıf değişikliklerini yakalar.');
  await quiz('c4q4', 'const m: Monster = new Wolf(...); m.cry() hangi sınıfın cry\'ı çalışır?', 'Wolf\'unki (nesnenin gerçek sınıfı)', ["Monster'ınki (değişkenin tipi)", 'Rastgele biri'],
    'Dynamic dispatch: çalışma anında nesnenin gerçek sınıfına bakılır.');
  markDone(4);
}
