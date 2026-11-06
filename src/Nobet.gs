/**
 * Nöbet çizelgesi algoritması (bir ya da birden çok hafta).
 *
 * Girdi:
 *   {
 *     gunler: [0, 1, 2, 3, 4],              // 0 = Pazartesi ... 4 = Cuma
 *     yerler: [{ ad: 'Bahçe', kisi: 2 }],   // her gün her yerde kaç kişi nöbet tutacak
 *     ogretmenler: [
 *       { ad: 'Ayşe Yılmaz', gunler: [0, 1, 2], haftalikMax: 2 }
 *       // gunler: öğretmenin okulda olduğu günler
 *       // haftalikMax: isteğe bağlı, haftada en fazla nöbet sayısı
 *     ],
 *     haftaSayisi: 6                         // isteğe bağlı, varsayılan 1 (en fazla 12)
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
 * Yöntem: haftaları, günleri ve yerleri sırayla gezer; her kontenjana o gün müsait olan,
 * o gün başka yerde görevi olmayan, haftalık sınırını aşmamış öğretmenlerden toplamda en az
 * nöbet tutmuş olanı atar. Eşitlikte sırasıyla: o hafta daha az nöbeti olan, o yerde ve o
 * günde daha az nöbet tutmuş olan (haftalar arasında yer ve gün döner), müsait günü az olan
 * öne alınır; tam eşitlikte sıra her hafta kaydırılır.
 */
var NOBET_GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function olusturNobetCizelgesi(girdi) {
  var gunler = girdi.gunler || [0, 1, 2, 3, 4];
  var yerler = girdi.yerler || [];
  var ogretmenler = girdi.ogretmenler || [];
  var haftaSayisi = Math.max(1, Math.min(12, Math.floor(Number(girdi.haftaSayisi) || 1)));
  var n = ogretmenler.length;

  var sayaclar = {}, yerSay = {}, gunSay = {}, sira = {};
  ogretmenler.forEach(function (o, i) {
    sayaclar[o.ad] = 0;
    yerSay[o.ad] = {};
    gunSay[o.ad] = {};
    sira[o.ad] = i;
  });

  var atamalar = [];
  var uyarilar = [];
  var haftalik = [];

  for (var hafta = 0; hafta < haftaSayisi; hafta++) {
    var haftaSay = {};
    ogretmenler.forEach(function (o) { haftaSay[o.ad] = 0; });
    var kaydir = n ? (hafta * 3) % n : 0;

    gunler.forEach(function (gun) {
      var bugunAtananlar = {};

      yerler.forEach(function (yer) {
        var eksik = 0;

        for (var k = 0; k < yer.kisi; k++) {
          var adaylar = ogretmenler.filter(function (o) {
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
              (yerSay[a.ad][yer.ad] || 0) - (yerSay[b.ad][yer.ad] || 0) ||
              (gunSay[a.ad][gun] || 0) - (gunSay[b.ad][gun] || 0) ||
              a.gunler.length - b.gunler.length ||
              ((sira[a.ad] - kaydir + n) % n) - ((sira[b.ad] - kaydir + n) % n)
            );
          });

          var secilen = adaylar[0];
          bugunAtananlar[secilen.ad] = true;
          sayaclar[secilen.ad]++;
          haftaSay[secilen.ad]++;
          yerSay[secilen.ad][yer.ad] = (yerSay[secilen.ad][yer.ad] || 0) + 1;
          gunSay[secilen.ad][gun] = (gunSay[secilen.ad][gun] || 0) + 1;
          atamalar.push({ hafta: hafta, gun: gun, yer: yer.ad, ogretmen: secilen.ad });
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
