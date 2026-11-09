/**
 * Nöbet çizelgesi algoritması (bir ya da birden çok hafta).
 *
 * Girdi:
 *   {
 *     gunler: [0, 1, 2, 3, 4],              // 0 = Pazartesi ... 4 = Cuma
 *     yerler: [{ ad: 'Bahçe', kisi: 2 }],   // her gün her yerde kaç kişi nöbet tutacak
 *     ogretmenler: [
 *       { ad: 'Ayşe Yılmaz', gunler: [0, 1, 2], haftalikMax: 2, sabitYer: '' }
 *       // gunler: öğretmenin nöbet tutabileceği günler (ör. 5. veya 6. dersi boş olan günler)
 *       // haftalikMax: isteğe bağlı, haftada en fazla nöbet sayısı
 *       // sabitYer: isteğe bağlı; doluysa öğretmen her müsait gününde yalnız o yerde nöbet tutar
 *       //           (ör. servis nöbetçileri) ve dönüşümlü dağıtıma katılmaz
 *     ],
 *     haftaSayisi: 4,                        // isteğe bağlı, varsayılan 1 (en fazla 12)
 *     ardisikKacin: true                     // isteğe bağlı: mümkünse aynı haftada arka arkaya iki gün nöbet yazma
 *   }
 *
 * Çıktı:
 *   {
 *     atamalar: [{ hafta: 0, gun: 0, yer: 'Bahçe', ogretmen: 'Ayşe Yılmaz' }],
 *     sayaclar: { 'Ayşe Yılmaz': 6 },        // tüm haftaların toplamı
 *     haftalik: [{ 'Ayşe Yılmaz': 1 }, ...], // hafta hafta sayılar
 *     uyarilar: ['Hafta 2 · Salı - Bahçe: 1 kişilik açık kaldı']
 *   }
 *
 * Yöntem: önce sabit nöbetçiler kendi yerlerine yazılır (yerin kişi sayısı kadar). Sonra haftaları,
 * günleri ve yerleri sırayla gezer; her kalan kontenjana o gün müsait olan,
 * o gün başka yerde görevi olmayan, haftalık sınırını aşmamış öğretmenlerden toplamda en az
 * nöbet tutmuş olanı atar. Eşitlikte sırasıyla: o hafta daha az nöbeti olan, o yerde ve o
 * günde daha az nöbet tutmuş olan (haftalar arasında yer ve gün döner), müsait günü az olan
 * öne alınır; tam eşitlikte sıra her hafta kaydırılır. ardisikKacin açıksa, eşit sayıdakiler arasında
 * bir önceki gün nöbet tutmamış olan öne alınır.
 */
var NOBET_GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function olusturNobetCizelgesi(girdi) {
  var gunler = girdi.gunler || [0, 1, 2, 3, 4];
  var yerler = girdi.yerler || [];
  var ogretmenler = girdi.ogretmenler || [];
  var haftaSayisi = Math.max(1, Math.min(12, Math.floor(Number(girdi.haftaSayisi) || 1)));
  var ardisikKacin = !!girdi.ardisikKacin;
  var yerAdlari = yerler.map(function (y) { return y.ad; });
  var sabitler = ogretmenler.filter(function (o) { return o.sabitYer && yerAdlari.indexOf(o.sabitYer) > -1; });
  var donusumlu = ogretmenler.filter(function (o) { return sabitler.indexOf(o) < 0; });
  var n = donusumlu.length;

  var sayaclar = {}, yerSay = {}, gunSay = {}, sira = {};
  ogretmenler.forEach(function (o, i) {
    sayaclar[o.ad] = 0;
    yerSay[o.ad] = {};
    gunSay[o.ad] = {};
    sira[o.ad] = donusumlu.indexOf(o);
  });

  var atamalar = [];
  var uyarilar = [];
  var haftalik = [];

  for (var hafta = 0; hafta < haftaSayisi; hafta++) {
    var haftaSay = {};
    var haftaGun = {};
    ogretmenler.forEach(function (o) { haftaSay[o.ad] = 0; haftaGun[o.ad] = {}; });
    var kaydir = n ? (hafta * 3) % n : 0;

    gunler.forEach(function (gun) {
      var bugunAtananlar = {};
      function ata(o, yer, g) {
        bugunAtananlar[o.ad] = true;
        sayaclar[o.ad]++;
        haftaSay[o.ad]++;
        haftaGun[o.ad][g] = true;
        yerSay[o.ad][yer.ad] = (yerSay[o.ad][yer.ad] || 0) + 1;
        gunSay[o.ad][g] = (gunSay[o.ad][g] || 0) + 1;
        atamalar.push({ hafta: hafta, gun: g, yer: yer.ad, ogretmen: o.ad });
      }

      yerler.forEach(function (yer) {
        var eksik = 0;
        var dolu = 0;

        // Sabit nöbetçiler: kendi yerlerinde, müsait oldukları her gün
        sabitler.forEach(function (o) {
          if (o.sabitYer !== yer.ad || dolu >= yer.kisi || o.gunler.indexOf(gun) < 0 || bugunAtananlar[o.ad]) return;
          var limit = o.haftalikMax > 0 ? o.haftalikMax : Infinity;
          if (haftaSay[o.ad] >= limit) return;
          ata(o, yer, gun);
          dolu++;
        });

        for (var k = dolu; k < yer.kisi; k++) {
          var adaylar = donusumlu.filter(function (o) {
            var limit = o.haftalikMax > 0 ? o.haftalikMax : Infinity;
            return o.gunler.indexOf(gun) > -1 && !bugunAtananlar[o.ad] && haftaSay[o.ad] < limit;
          });

          if (adaylar.length === 0) {
            eksik++;
            continue;
          }

          adaylar.sort(function (a, b) {
            return (
              sayaclar[a.ad] - sayaclar[b.ad] ||
              haftaSay[a.ad] - haftaSay[b.ad] ||
              (ardisikKacin ? (haftaGun[a.ad][gun - 1] ? 1 : 0) - (haftaGun[b.ad][gun - 1] ? 1 : 0) : 0) ||
              (yerSay[a.ad][yer.ad] || 0) - (yerSay[b.ad][yer.ad] || 0) ||
              (gunSay[a.ad][gun] || 0) - (gunSay[b.ad][gun] || 0) ||
              a.gunler.length - b.gunler.length ||
              ((sira[a.ad] - kaydir + n) % n) - ((sira[b.ad] - kaydir + n) % n)
            );
          });

          ata(adaylar[0], yer, gun);
        }

        if (eksik > 0) {
          uyarilar.push(
            (haftaSayisi > 1 ? 'Hafta ' + (hafta + 1) + ' · ' : '') +
            NOBET_GUN_ADLARI[gun] + ' - ' + yer.ad + ': ' + eksik + ' kişilik açık kaldı'
          );
        }
      });
    });
    haftalik.push(haftaSay);
  }

  return { atamalar: atamalar, sayaclar: sayaclar, haftalik: haftalik, uyarilar: uyarilar };
}
