/**
 * Deneme (TYT, AYT, LGS vb.) sonuç analizi.
 *
 * Okul ve yayınevi sonuç çizelgelerinde her ders için yan yana SS (soru sayısı),
 * D (doğru), Y (yanlış) ve bazen B (boş), N (net) sütunları bulunur:
 *   SINIF | Adı Soyadı | TÜR-SS | TÜR-D | TÜR-Y | MAT-SS | MAT-D | MAT-Y | ...
 *
 * Girdi:
 *   {
 *     baslik: ['SINIF', 'Adı Soyadı', 'TÜR-SS', 'TÜR-D', ...],   // başlık satırı
 *     satirlar: [['12-TM', 'Ayşe Demir', 40, 25, 10, ...], ...], // başlığın altındaki satırlar
 *     adSutunu: 1,          // isteğe bağlı; yoksa başlıktan ya da metin sütunundan bulunur
 *     yanlisKatsayi: 4      // kaç yanlış bir doğruyu götürür (YKS 4, LGS 3); 0 = götürmez
 *   }
 *
 * Oturumlar: bir ders kodu ilk kez tekrar ettiğinde ikinci oturum başlar (TYT'den sonra AYT).
 * Sonraki tekrarlar aynı oturumda kalır ve "-1", "-2" diye ayrılır (AYT Tarih-1, Tarih-2).
 * İlk oturumun soru toplamı 120 ise oturumlar TYT ve AYT diye adlandırılır.
 *
 * Bir öğrencinin bir oturumdaki tüm D ve Y hücreleri boşsa o oturuma girmemiş sayılır.
 * Hücre 0 ise girmiş ama doğru/yanlış yapmamıştır.
 *
 * Ders başarısı: ortalama net / soru sayısı. %60 ve üstü iyi, %30-59 orta, altı düşük.
 */
var DENEME_IYI = 0.6;
var DENEME_DUSUK = 0.3;
var DENEME_YANLIS_UYARI = 0.4; // yanlışların cevaplananlara oranı
var DENEME_BOS_UYARI = 0.6;    // boşların soru sayısına oranı

var DENEME_ALAN = /^(.*?\S)\s*[-_.\s]\s*(SS|S\.S\.?|SORU|D|DOĞRU|DOGRU|Y|YANLIŞ|YANLIS|B|BOŞ|BOS|N|NET)\.?$/;
var DENEME_PUAN = /^(.*?\S)\s*[-_.\s]\s*(PUAN|PUANI|SINIF|ŞUBE|OKUL|[Iİ]LÇE|[Iİ]L|GENEL|TÜRK[Iİ]YE)\.?$/;
var DENEME_ADSUT = /(AD[Iİ]?\s*SOYAD|ÖĞRENC[Iİ]\s*AD|OGRENC[Iİ]\s*AD|^AD[Iİ]?$|^[Iİ]S[Iİ]M|^ÖĞRENC[Iİ]$|^OGRENC[Iİ]$)/;
var DENEME_SINIFSUT = /^(SINIF|ŞUBE|SUBE)/;
var DENEME_OZET = /^(SINIF\s*)?(ORTALAMA|TOPLAM|GENEL|ORT\.?|M[Iİ]N|MAX|MAKS|EN\s*(YÜKSEK|DÜŞÜK))/;

var DENEME_DERSLER = [
  { on: 'TÜR', ad: 'Türkçe', ayt: 'Türk Dili ve Edebiyatı' },
  { on: 'TUR', ad: 'Türkçe', ayt: 'Türk Dili ve Edebiyatı' },
  { on: 'EDE', ad: 'Edebiyat' },
  { on: 'EDB', ad: 'Edebiyat' },
  { on: 'MAT', ad: 'Matematik' },
  { on: 'GEO', ad: 'Geometri' },
  { on: 'FİZ', ad: 'Fizik' },
  { on: 'FIZ', ad: 'Fizik' },
  { on: 'KİM', ad: 'Kimya' },
  { on: 'KIM', ad: 'Kimya' },
  { on: 'BİY', ad: 'Biyoloji' },
  { on: 'BIY', ad: 'Biyoloji' },
  { on: 'TAR', ad: 'Tarih' },
  { on: 'COĞ', ad: 'Coğrafya' },
  { on: 'COG', ad: 'Coğrafya' },
  { on: 'FEL', ad: 'Felsefe', ayt: 'Felsefe Grubu' },
  { on: 'DİN', ad: 'Din Kültürü' },
  { on: 'DIN', ad: 'Din Kültürü' },
  { on: 'DKAB', ad: 'Din Kültürü' },
  { on: 'FEN', ad: 'Fen Bilimleri' },
  { on: 'SOS', ad: 'Sosyal Bilimler' },
  { on: 'İNK', ad: 'T.C. İnkılap Tarihi' },
  { on: 'INK', ad: 'T.C. İnkılap Tarihi' },
  { on: 'İNG', ad: 'İngilizce' },
  { on: 'ING', ad: 'İngilizce' },
  { on: 'YDİL', ad: 'Yabancı Dil' }
];

function denemeBuyuk(v) {
  return String(v === null || v === undefined ? '' : v).trim().toLocaleUpperCase('tr-TR');
}

function denemeBos(v) {
  return v === '' || v === null || v === undefined || (typeof v === 'string' && !v.trim());
}

function denemeSayi(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (denemeBos(v)) return null;
  var n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function denemeAlanTuru(t) {
  if (t === 'SS' || t.indexOf('S.S') === 0 || t === 'SORU') return 'ss';
  if (t === 'D' || t.indexOf('DO') === 0) return 'd';
  if (t === 'Y' || t.indexOf('YA') === 0) return 'y';
  if (t === 'B' || t.indexOf('BO') === 0) return 'b';
  return 'n';
}

function denemeDersAdi(kod, aytMi) {
  var k = denemeBuyuk(kod);
  for (var i = 0; i < DENEME_DERSLER.length; i++) {
    var d = DENEME_DERSLER[i];
    if (k.indexOf(d.on) === 0) return aytMi && d.ayt ? d.ayt : d.ad;
  }
  return String(kod);
}

/**
 * Başlık satırından dersleri ve oturumları bulur. Deneme biçimi değilse null döner.
 */
function denemeSutunlariBul(baslik) {
  baslik = baslik || [];
  var dersler = [];
  var son = null;
  for (var c = 0; c < baslik.length; c++) {
    var m = DENEME_ALAN.exec(denemeBuyuk(baslik[c]));
    if (!m) { son = null; continue; }
    var kod = m[1].replace(/[-_.\s]+$/, '');
    if (/^(TOPLAM|TOP\.?|GENEL|TOTAL)$/.test(kod)) { son = null; continue; }
    var tur = denemeAlanTuru(m[2]);
    // Aynı ders yan yana sütunlarda devam ediyorsa ona ekle, yoksa yeni ders başlat.
    if (!son || son.kod !== kod || son[tur] !== undefined) {
      son = { kod: kod, etiket: String(baslik[c]).trim().replace(/\s*[-_.\s]\s*\S+$/, '') };
      dersler.push(son);
    }
    son[tur] = c;
  }
  dersler = dersler.filter(function (d) { return d.d !== undefined && d.y !== undefined; });
  if (dersler.length < 2) return null;

  // Oturumlar
  var gorulen = {};
  var ikinciBas = -1;
  dersler.forEach(function (d, i) {
    if (ikinciBas < 0 && gorulen[d.kod]) ikinciBas = i;
    gorulen[d.kod] = true;
  });
  dersler.forEach(function (d, i) { d.oturum = ikinciBas >= 0 && i >= ikinciBas ? 1 : 0; });
  var oturumSayisi = ikinciBas >= 0 ? 2 : 1;

  // Puan sütunları: TYT-Puan, SAY-Puan ve yanlarındaki Sınıf/Okul/Genel sıraları
  var puanlar = [];
  var bul = {};
  for (c = 0; c < baslik.length; c++) {
    var pm = DENEME_PUAN.exec(denemeBuyuk(baslik[c]));
    if (!pm) continue;
    var tur = pm[1];
    var alan = pm[2].indexOf('PUAN') === 0 ? 'puan' : pm[2] === 'ŞUBE' ? 'sinif' : pm[2] === 'TÜRKİYE' || pm[2] === 'TÜRKIYE' ? 'genel'
      : pm[2].replace('İ', 'I').indexOf('ILÇE') === 0 ? 'ilce' : /^[Iİ]L$/.test(pm[2]) ? 'il' : pm[2].toLowerCase().replace('ı', 'i');
    if (!bul[tur]) { bul[tur] = { ad: String(baslik[c]).trim().replace(/\s*[-_.\s]\s*\S+$/, '') }; puanlar.push(bul[tur]); }
    if (bul[tur][alan] === undefined) bul[tur][alan] = c;
  }
  puanlar = puanlar.filter(function (p) { return p.puan !== undefined; });

  return { dersler: dersler, oturumSayisi: oturumSayisi, puanlar: puanlar };
}

function denemeAdSutunuBul(baslik, satirlar, dolu) {
  var c;
  for (c = 0; c < baslik.length; c++) {
    if (!dolu[c] && DENEME_ADSUT.test(denemeBuyuk(baslik[c]))) return c;
  }
  var kolon = satirlar.reduce(function (m, r) { return Math.max(m, r.length); }, baslik.length);
  for (c = 0; c < kolon; c++) {
    if (dolu[c]) continue;
    var h = satirlar.map(function (r) { return r[c]; }).filter(function (v) { return !denemeBos(v); });
    var metin = h.filter(function (v) { return denemeSayi(v) === null && String(v).trim().length >= 3; }).length;
    if (h.length >= 2 && metin / h.length >= 0.7 && !DENEME_SINIFSUT.test(denemeBuyuk(baslik[c]))) return c;
  }
  return -1;
}

function denemeOrtalama(dizi) {
  if (!dizi.length) return 0;
  return dizi.reduce(function (t, v) { return t + v; }, 0) / dizi.length;
}

function denemeMedyan(dizi) {
  if (!dizi.length) return 0;
  var s = dizi.slice().sort(function (a, b) { return a - b; });
  var m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function denemeBasariEtiketi(oran) {
  if (oran >= DENEME_IYI) return 'İyi';
  if (oran >= DENEME_DUSUK) return 'Orta';
  return 'Düşük';
}

function denemeAnaliziYap(girdi) {
  girdi = girdi || {};
  var baslik = girdi.baslik || [];
  var satirlar = girdi.satirlar || [];
  var k = girdi.yanlisKatsayi === undefined || girdi.yanlisKatsayi === null ? 4 : Number(girdi.yanlisKatsayi);
  if (!(k >= 0)) k = 4;

  var bicim = denemeSutunlariBul(baslik);
  if (!bicim) return { gecerli: false, neden: 'bicim' };
  var dersler = bicim.dersler;

  var dolu = {};
  dersler.forEach(function (d) { ['ss', 'd', 'y', 'b', 'n'].forEach(function (t) { if (d[t] !== undefined) dolu[d[t]] = true; }); });
  bicim.puanlar.forEach(function (p) { ['puan', 'sinif', 'okul', 'ilce', 'il', 'genel'].forEach(function (t) { if (p[t] !== undefined) dolu[p[t]] = true; }); });
  var adSut = girdi.adSutunu >= 0 ? Number(girdi.adSutunu) : denemeAdSutunuBul(baslik, satirlar, dolu);
  if (adSut < 0) return { gecerli: false, neden: 'ad' };
  var sinifSut = -1;
  for (var c = 0; c < baslik.length; c++) {
    if (c !== adSut && DENEME_SINIFSUT.test(denemeBuyuk(baslik[c]))) { sinifSut = c; break; }
  }

  // Soru sayısı: SS sütununda en sık görülen değer; SS yoksa D+Y+B'nin en büyüğü.
  dersler.forEach(function (d) {
    var say = {};
    var enBuyuk = 0;
    satirlar.forEach(function (r) {
      var ad = denemeBuyuk(r[adSut]);
      if (!ad || DENEME_OZET.test(ad)) return;
      if (d.ss !== undefined) {
        var s = denemeSayi(r[d.ss]);
        if (s > 0) say[s] = (say[s] || 0) + 1;
      }
      var top = (denemeSayi(r[d.d]) || 0) + (denemeSayi(r[d.y]) || 0) + (d.b !== undefined ? denemeSayi(r[d.b]) || 0 : 0);
      enBuyuk = Math.max(enBuyuk, top);
    });
    var enSik = Object.keys(say).sort(function (a, b) { return say[b] - say[a] || b - a; })[0];
    d.soru = enSik ? Number(enSik) : enBuyuk;
    d.ssTahmin = !enSik;
  });

  // Oturum ve ders adları
  var ilkToplam = dersler.filter(function (d) { return d.oturum === 0; }).reduce(function (t, d) { return t + d.soru; }, 0);
  var yks = bicim.oturumSayisi === 2 && ilkToplam === 120;
  var oturumAdlari = bicim.oturumSayisi === 1 ? ['Deneme'] : (yks ? ['TYT', 'AYT'] : ['1. oturum', '2. oturum']);
  for (var o = 0; o < bicim.oturumSayisi; o++) {
    var grup = dersler.filter(function (d) { return d.oturum === o; });
    var adet = {};
    grup.forEach(function (d) { adet[d.kod] = (adet[d.kod] || 0) + 1; });
    var sira = {};
    grup.forEach(function (d) {
      var ad = denemeDersAdi(d.kod, yks && o === 1);
      if (adet[d.kod] > 1) {
        sira[d.kod] = (sira[d.kod] || 0) + 1;
        d.ad = ad + '-' + sira[d.kod];
        d.kisa = d.etiket + '-' + sira[d.kod];
      } else {
        d.ad = ad;
        d.kisa = d.etiket;
      }
    });
  }

  // Öğrenciler
  var ogrenciler = [];
  var tutarsiz = [];
  satirlar.forEach(function (r) {
    var adHam = r[adSut];
    if (denemeBos(adHam) || denemeSayi(adHam) !== null) return;
    var ad = String(adHam).trim();
    if (DENEME_OZET.test(denemeBuyuk(ad))) return;
    var ogr = { ad: ad, sinif: sinifSut >= 0 && !denemeBos(r[sinifSut]) ? String(r[sinifSut]).trim() : '', oturumlar: [] };
    // 0 puan ve boş sıra, o puan türünün hesaplanmadığı anlamına gelir.
    ogr.puanlar = bicim.puanlar.map(function (p) {
      var v = denemeSayi(r[p.puan]);
      if (!(v > 0)) return null;
      var x = { puan: v };
      ['sinif', 'okul', 'ilce', 'il', 'genel'].forEach(function (t) {
        if (p[t] !== undefined && denemeSayi(r[p[t]]) > 0) x[t] = denemeSayi(r[p[t]]);
      });
      return x;
    });
    for (var o = 0; o < bicim.oturumSayisi; o++) {
      var grup = dersler.filter(function (d) { return d.oturum === o; });
      var girdiMi = grup.some(function (d) { return !denemeBos(r[d.d]) || !denemeBos(r[d.y]); });
      if (!girdiMi) { ogr.oturumlar.push(null); continue; }
      var sonuc = grup.map(function (d) {
        var dv = Math.max(0, denemeSayi(r[d.d]) || 0);
        var yv = Math.max(0, denemeSayi(r[d.y]) || 0);
        var ss = d.soru;
        if (dv + yv > ss) tutarsiz.push({ ad: ad, ders: d.kisa, d: dv, y: yv, ss: ss });
        var bv = d.b !== undefined && denemeSayi(r[d.b]) !== null ? denemeSayi(r[d.b]) : Math.max(0, ss - dv - yv);
        var net = k > 0 ? dv - yv / k : dv;
        return { d: dv, y: yv, b: bv, net: net };
      });
      ogr.oturumlar.push(sonuc);
    }
    if (ogr.oturumlar.some(function (x) { return x; }) || ogr.puanlar.some(function (x) { return x; })) ogrenciler.push(ogr);
  });

  if (!ogrenciler.length) return { gecerli: false, neden: 'ogrenci' };

  var oturumlar = [];
  for (var oi = 0; oi < bicim.oturumSayisi; oi++) {
    oturumlar.push(denemeOturumAnalizi(oi, oturumAdlari[oi], dersler.filter(function (d) { return d.oturum === oi; }), ogrenciler));
  }

  var puanTurleri = bicim.puanlar.map(function (p, j) {
    var v = ogrenciler.map(function (g) { return g.puanlar[j]; }).filter(function (x) { return x; }).map(function (x) { return x.puan; });
    return {
      ad: p.ad, n: v.length,
      ortalama: denemeOrtalama(v),
      enYuksek: v.length ? Math.max.apply(null, v) : 0,
      enDusuk: v.length ? Math.min.apply(null, v) : 0,
      siralar: ['sinif', 'okul', 'ilce', 'il', 'genel'].filter(function (t) { return p[t] !== undefined; })
    };
  });
  var puanSutunlari = [];
  puanTurleri.forEach(function (p, j) { if (p.n) puanSutunlari.push(j); });
  var puanOgrencileri = ogrenciler.filter(function (g) { return g.puanlar.some(function (x) { return x; }); }).map(function (g) {
    return { ad: g.ad, sinif: g.sinif, degerler: puanSutunlari.map(function (j) { return g.puanlar[j]; }) };
  });
  var ilk = puanSutunlari[0];
  if (ilk !== undefined) {
    puanOgrencileri.sort(function (a, b) {
      return ((b.degerler[0] || {}).puan || 0) - ((a.degerler[0] || {}).puan || 0) || a.ad.localeCompare(b.ad, 'tr');
    });
  }

  return {
    gecerli: true,
    yanlisKatsayi: k,
    puanlar: {
      turler: puanSutunlari.map(function (j) { return puanTurleri[j]; }),
      ogrenciler: puanOgrencileri
    },
    ogrenciSayisi: ogrenciler.length,
    oturumlar: oturumlar,
    tutarsiz: tutarsiz,
    adSutunu: adSut,
    ssTahmin: dersler.filter(function (d) { return d.ssTahmin; }).map(function (d) { return d.kisa; })
  };
}

function denemeOturumAnalizi(o, ad, dersler, ogrenciler) {
  var katilan = ogrenciler.filter(function (g) { return g.oturumlar[o]; });
  var n = katilan.length;
  var soruToplam = dersler.reduce(function (t, d) { return t + d.soru; }, 0);
  var sonuc = {
    ad: ad,
    n: n,
    girmeyen: ogrenciler.length - n,
    soruSayisi: soruToplam,
    dersler: dersler.map(function (d) { return { kod: d.kisa, ad: d.ad, soru: d.soru }; })
  };
  if (!n) return sonuc;

  var kayitlar = katilan.map(function (g) {
    var s = g.oturumlar[o];
    var top = function (alan) { return s.reduce(function (t, x) { return t + x[alan]; }, 0); };
    return { ad: g.ad, sinif: g.sinif, netler: s.map(function (x) { return x.net; }), sonuclar: s, net: top('net'), d: top('d'), y: top('y'), b: top('b') };
  });

  var netler = kayitlar.map(function (x) { return x.net; });
  var ort = denemeOrtalama(netler);
  sonuc.ortalamaNet = ort;
  sonuc.medyanNet = denemeMedyan(netler);
  sonuc.enYuksekNet = Math.max.apply(null, netler);
  sonuc.enDusukNet = Math.min.apply(null, netler);
  sonuc.stdSapma = Math.sqrt(denemeOrtalama(netler.map(function (v) { return (v - ort) * (v - ort); })));
  sonuc.basari = soruToplam > 0 ? ort / soruToplam : 0;

  sonuc.dersler.forEach(function (d, j) {
    var col = function (alan) { return kayitlar.map(function (x) { return x.sonuclar[j][alan]; }); };
    var dn = col('net');
    d.ortD = denemeOrtalama(col('d'));
    d.ortY = denemeOrtalama(col('y'));
    d.ortB = denemeOrtalama(col('b'));
    d.ortNet = denemeOrtalama(dn);
    d.enYuksekNet = Math.max.apply(null, dn);
    d.enDusukNet = Math.min.apply(null, dn);
    d.basari = d.soru > 0 ? d.ortNet / d.soru : 0;
    d.basariEtiket = denemeBasariEtiketi(d.basari);
    var cevap = d.ortD + d.ortY;
    d.yanlisOrani = cevap > 0 ? d.ortY / cevap : 0;
    d.bosOrani = d.soru > 0 ? d.ortB / d.soru : 0;
    d.cokYanlis = d.ortY >= 1 && d.yanlisOrani >= DENEME_YANLIS_UYARI;
    d.cokBos = d.bosOrani >= DENEME_BOS_UYARI;
  });

  // Sıralama (eşit net aynı sırayı alır)
  var sirali = kayitlar.slice().sort(function (a, b) {
    return b.net - a.net || String(a.ad).localeCompare(String(b.ad), 'tr');
  });
  sonuc.siralama = [];
  sirali.forEach(function (x, i) {
    var esit = i > 0 && Math.abs(sirali[i - 1].net - x.net) < 1e-9;
    sonuc.siralama.push({
      sira: esit ? sonuc.siralama[i - 1].sira : i + 1,
      ad: x.ad, sinif: x.sinif, net: x.net, d: x.d, y: x.y, b: x.b, netler: x.netler
    });
  });
  return sonuc;
}
