/**
 * Sınav analizi.
 *
 * Girdi:
 *   {
 *     gecmeNotu: 50,                                   // 100 üzerinden
 *     sorular: [{ no: 1, puan: 10, kazanim: 'Kesirler' }],
 *     ogrenciler: [{ ad: 'Ayşe Demir', puanlar: [8, 10, ...] }]  // soru sırasıyla alınan puan
 *   }
 *
 * Çıktı: sınıf özeti, not dağılımı, soru analizi (güçlük ve ayırt edicilik),
 * kazanım başarısı ve öğrenci sıralaması.
 *
 * Soru güçlüğü (p): ortalama puan / en yüksek puan. 0,30'un altı zor, 0,70 ve üstü kolay.
 * Ayırt edicilik (D): toplam puana göre en iyi %27 ile en düşük %27'nin ortalama farkı /
 * en yüksek puan. 0,40 ve üstü çok iyi, 0,30-0,39 iyi, 0,20-0,29 düzeltilmeli, altı zayıf.
 */
var SINAV_KAZANIM_ESIGI = 0.6;
var SINAV_DAGILIM = [
  { ad: '0–24', alt: 0 },
  { ad: '25–44', alt: 25 },
  { ad: '45–54', alt: 45 },
  { ad: '55–69', alt: 55 },
  { ad: '70–84', alt: 70 },
  { ad: '85–100', alt: 85 }
];

function sinavOrtalama(dizi) {
  if (!dizi.length) return 0;
  return dizi.reduce(function (t, v) { return t + v; }, 0) / dizi.length;
}

function sinavMedyan(dizi) {
  var s = dizi.slice().sort(function (a, b) { return a - b; });
  var m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sinavGuclukEtiketi(p) {
  if (p === null) return '–';
  if (p < 0.3) return 'Zor';
  if (p < 0.7) return 'Orta';
  return 'Kolay';
}

function sinavAyirtEtiketi(d) {
  if (d === null) return 'Yetersiz veri';
  if (d >= 0.4) return 'Çok iyi';
  if (d >= 0.3) return 'İyi';
  if (d >= 0.2) return 'Düzeltilmeli';
  return 'Zayıf';
}

function sinavAnaliziYap(girdi) {
  var sorular = girdi.sorular || [];
  var ogrenciler = girdi.ogrenciler || [];
  var gecmeNotu = girdi.gecmeNotu > 0 ? girdi.gecmeNotu : 50;
  var n = ogrenciler.length;
  var toplamPuan = sorular.reduce(function (t, s) { return t + (s.puan > 0 ? s.puan : 0); }, 0);

  if (!n || !sorular.length || toplamPuan <= 0) return { gecerli: false };

  // Puanları 0 ile sorunun en yüksek puanı arasına sıkıştır.
  var kayitlar = ogrenciler.map(function (o) {
    var puanlar = sorular.map(function (s, j) {
      var v = Number((o.puanlar || [])[j]);
      if (!isFinite(v) || v < 0) v = 0;
      return Math.min(v, s.puan > 0 ? s.puan : 0);
    });
    var toplam = puanlar.reduce(function (t, v) { return t + v; }, 0);
    return { ad: o.ad, puanlar: puanlar, toplam: toplam, yuz: toplam / toplamPuan * 100 };
  });

  var yuzler = kayitlar.map(function (k) { return k.yuz; });
  var ortalama = sinavOrtalama(yuzler);
  var varyans = sinavOrtalama(yuzler.map(function (v) { return (v - ortalama) * (v - ortalama); }));
  var gecenSayisi = kayitlar.filter(function (k) { return k.yuz >= gecmeNotu; }).length;

  // Not dağılımı
  var dagilim = SINAV_DAGILIM.map(function (d) { return { ad: d.ad, sayi: 0 }; });
  kayitlar.forEach(function (k) {
    for (var i = SINAV_DAGILIM.length - 1; i >= 0; i--) {
      if (k.yuz >= SINAV_DAGILIM[i].alt) { dagilim[i].sayi++; break; }
    }
  });

  // Sıralama (eşit puan aynı sırayı alır)
  var sirali = kayitlar.slice().sort(function (a, b) {
    return b.toplam - a.toplam || String(a.ad).localeCompare(String(b.ad), 'tr');
  });
  var siralama = [];
  sirali.forEach(function (k, i) {
    var sira = i > 0 && sirali[i - 1].toplam === k.toplam ? siralama[i - 1].sira : i + 1;
    siralama.push({ sira: sira, ad: k.ad, toplam: k.toplam, yuz: k.yuz, gecti: k.yuz >= gecmeNotu });
  });

  // Soru analizi
  var grupBoyu = Math.max(1, Math.round(0.27 * n));
  var ust = sirali.slice(0, grupBoyu);
  var alt = sirali.slice(n - grupBoyu);
  var soruSonuclari = sorular.map(function (s, j) {
    var tum = kayitlar.map(function (k) { return k.puanlar[j]; });
    var ort = sinavOrtalama(tum);
    var p = s.puan > 0 ? ort / s.puan : null;
    var d = null;
    if (s.puan > 0 && n >= 4) {
      var ustOrt = sinavOrtalama(ust.map(function (k) { return k.puanlar[j]; }));
      var altOrt = sinavOrtalama(alt.map(function (k) { return k.puanlar[j]; }));
      d = (ustOrt - altOrt) / s.puan;
    }
    return {
      no: s.no || j + 1,
      kazanim: s.kazanim || '',
      puan: s.puan,
      ortalama: ort,
      guclukDeger: p,
      guclukEtiket: sinavGuclukEtiketi(p),
      ayirtDeger: d,
      ayirtEtiket: sinavAyirtEtiketi(d)
    };
  });

  // Kazanım başarısı
  var gruplar = {};
  var sira = [];
  sorular.forEach(function (s, j) {
    var ad = (s.kazanim || '').trim();
    if (!ad || !(s.puan > 0)) return;
    if (!gruplar[ad]) { gruplar[ad] = { ad: ad, kazanilan: 0, olasi: 0, sorular: [] }; sira.push(ad); }
    gruplar[ad].olasi += s.puan * n;
    gruplar[ad].kazanilan += kayitlar.reduce(function (t, k) { return t + k.puanlar[j]; }, 0);
    gruplar[ad].sorular.push(s.no || j + 1);
  });
  var kazanimlar = sira.map(function (ad) {
    var g = gruplar[ad];
    var oran = g.kazanilan / g.olasi;
    return { ad: ad, oran: oran, tekrar: oran < SINAV_KAZANIM_ESIGI, sorular: g.sorular };
  });

  return {
    gecerli: true,
    n: n,
    toplamPuan: toplamPuan,
    gecmeNotu: gecmeNotu,
    ortalama: ortalama,
    medyan: sinavMedyan(yuzler),
    enYuksek: Math.max.apply(null, yuzler),
    enDusuk: Math.min.apply(null, yuzler),
    stdSapma: Math.sqrt(varyans),
    gecenSayisi: gecenSayisi,
    gecmeOrani: gecenSayisi / n,
    dagilim: dagilim,
    sorular: soruSonuclari,
    kazanimlar: kazanimlar,
    siralama: siralama
  };
}
