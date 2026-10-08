import { pause, quiz, say, teach, tip, title, b, em, code } from '../ui';
import { playground, regions, showRegion } from '../lab';
import { markDone } from '../state';

export async function chapter6(): Promise<void> {
  title('BÖLÜM 6 · INTERFACES  (Arayüzler / Sözleşmeler)');
  await teach(
    `${b('interface')} = "şunları yapabilen herkes" sözleşmesi. İçinde ${em('hiç kod yoktur')}, sadece imzalar. Bir sınıf ${code('implements')} ile bu sözleşmeyi imzalar.`,
    `Kalıtımdan farkı: akrabalık şartı yok. Kedi de, maceracı da ${code('Healable')} olabilir; ortak bir üst sınıfa ihtiyaçları yok. Ayrıca bir sınıf ${em('birden fazla')} interface implemente edebilir (extends ise tek).`,
    `Tablo:  ${em('abstract class')}: ortak KOD + sözleşme, tek extends  |  ${em('interface')}: sadece sözleşme, çoklu implements.`,
    `TS'te interface'ler derlemeden sonra ${em('tamamen silinir')}; yalnızca derleme zamanı güvencesidir.`,
  );
  say();
  showRegion('lessons/ch06#Contracts', 'interface sözleşmeleri');
  showRegion('lessons/ch06#Roles', 'sözleşmeyi imzalayan sınıflar');
  tip('İki küçük interface: "iyileştirilebilir" (Healable) ve "iyileştirebilen" (HealSource). Küçük ve odaklı rol = iyi tasarım (ISP, 10. bölüm).');

  await playground(regions('lessons/ch06#Contracts', 'lessons/ch06#Roles'), [
    { code: `const party: Healable[] = [new Adventurer('Ali'), new Pet()];\nconst fire = new Campfire();\nfor (const p of party) show(fire.use(p));`, label: 'Farklı sınıflar, aynı Healable rolü',
      tip: 'Adventurer ve Pet akraba değil ama aynı sözleşmeyi imzaladı; Campfire ikisini de iyileştirir.' },
    { code: `class Broken implements Healable { readonly name = 'x'; }`, tip: 'Sözleşmeyi tam yerine getirmeyen sınıf derlenmez (heal eksik).' },
    { code: `const ghost: Healable = { name: 'Hayalet', heal: (n: number) => n };\nshow(new Campfire().use(ghost));`, label: 'implements yazmadan, sadece şekli uyan nesne',
      tip: '😮 TS "yapısal tiplemeyi" (duck typing) kullanır: şekli uyan her şey sözleşmeyi karşılar.' },
    { code: `show(Healable);`, tip: 'interface çalışma anında YOK; sadece tip düzeyinde yaşar.' },
    { code: `new Potion().use(new Campfire());`, tip: 'Campfire iyileştirilemez (heal ve name yok): yanlış rol, derleyici yakaladı.' },
    { code: `const p = new Priest('Rahip');\nshow(p.use(new Adventurer('Ali')));\nshow(p.use(p));`, label: 'Priest: iki rol birden (Healable + HealSource)',
      tip: 'Bir sınıf birden çok sözleşme imzalayabilir; bu çoklu kalıtımın güvenli yoludur.' },
  ], { need: 4, header: 'SÖZLEŞME LABORATUVARI' });

  await pause('Oyundaki gerçek interface\'ler →');
  showRegion('model#Interfaces', 'oyunun interface\'leri');
  showRegion('model#Items', 'Potion ve Campfire (HealSource)');
  tip('Character implements Healable → potion da kamp ateşi de kahramanı iyileştirebilir; ikisini de aynı HealSource sözleşmesiyle çağırırız.');

  await quiz('c6q1', 'interface ile abstract class arasındaki en önemli fark nedir?', 'interface sadece sözleşmedir (kod yok) ve çoklu implements edilebilir; abstract class ortak kod taşıyabilir ve tek extends edilir',
    ['Aralarında fark yoktur', 'interface nesne üretebilir, abstract class üretemez'], 'Rol paylaşımı için interface, kod paylaşımı + sözleşme için abstract class.');
  await quiz('c6q2', 'Derlenmiş JavaScript\'te interface\'ler ne olur?', 'Tamamen silinir; çalışma anında yoklar', ['Sınıfa dönüşür', 'Nesne olarak kalır'],
    'show(Healable) satırını hatırla: değer olarak kullanılamaz.');
  await quiz('c6q3', 'Adventurer ve Pet farklı sınıflar. İkisi de Healable[] içinde tutulabilir mi?', 'Evet; ikisi de Healable sözleşmesini yerine getirir', ['Hayır, ortak bir üst sınıf gerekir', 'Sadece any ile'],
    'Interface sayesinde akrabalık olmadan polimorfizm.');
  markDone(6);
}
