/**
 * Nöbet çizelgesi algoritması.
 *
 * Girdi:
 *   {
 *     gunler: [0, 1, 2, 3, 4],              // 0 = Pazartesi ... 4 = Cuma
 *     yerler: [{ ad: 'Bahçe', kisi: 2 }],   // her gün her yerde kaç kişi nöbet tutacak
 *     ogretmenler: [
 *       { ad: 'Ayşe Yılmaz', gunler: [0, 1, 2], haftalikMax: 2 }
 *       // gunler: öğretmenin okulda olduğu günler
 *       // haftalikMax: isteğe bağlı, haftada en fazla nöbet sayısı
 *     ]
 *   }
 *
 * Çıktı:
 *   {
 *     atamalar: [{ gun: 0, yer: 'Bahçe', ogretmen: 'Ayşe Yılmaz' }],
 *     sayaclar: { 'Ayşe Yılmaz': 1 },
 *     uyarilar: ['Salı - Bahçe: 1 kişilik açık kaldı']
 *   }
 *
 * Yöntem: günleri ve yerleri sırayla gezer, her kontenjana o gün müsait olan,
 * o gün başka yerde görevi olmayan ve şu ana kadar en az nöbet tutmuş öğretmeni
 * atar. Eşitlikte az günü müsait olan öğretmen öne alınır (fırsatı az olanı
 * önce yerleştirmek açık kalma ihtimalini düşürür).
 */
var NOBET_GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function olusturNobetCizelgesi(girdi) {
  var gunler = girdi.gunler || [0, 1, 2, 3, 4];
  var yerler = girdi.yerler || [];
  var ogretmenler = girdi.ogretmenler || [];

  var sayaclar = {};
  ogretmenler.forEach(function (o) {
    sayaclar[o.ad] = 0;
  });

  var atamalar = [];
  var uyarilar = [];

  gunler.forEach(function (gun) {
    var bugunAtananlar = {};

    yerler.forEach(function (yer) {
      var eksik = 0;

      for (var k = 0; k < yer.kisi; k++) {
        var adaylar = ogretmenler.filter(function (o) {
          var limit = o.haftalikMax > 0 ? o.haftalikMax : Infinity;
          return (
            o.gunler.indexOf(gun) > -1 &&
            !bugunAtananlar[o.ad] &&
            sayaclar[o.ad] < limit
          );
        });

        if (adaylar.length === 0) {
          eksik++;
          continue;
        }

        adaylar.sort(function (a, b) {
          return (
            sayaclar[a.ad] - sayaclar[b.ad] ||
            a.gunler.length - b.gunler.length ||
            a.ad.localeCompare(b.ad, 'tr')
          );
        });

        var secilen = adaylar[0];
        bugunAtananlar[secilen.ad] = true;
        sayaclar[secilen.ad]++;
        atamalar.push({ gun: gun, yer: yer.ad, ogretmen: secilen.ad });
      }

      if (eksik > 0) {
        uyarilar.push(
          NOBET_GUN_ADLARI[gun] + ' - ' + yer.ad + ': ' + eksik + ' kişilik açık kaldı'
        );
      }
    });
  });

  return { atamalar: atamalar, sayaclar: sayaclar, uyarilar: uyarilar };
}
