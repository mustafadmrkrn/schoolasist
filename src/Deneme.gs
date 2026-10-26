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

  var ogrAnaliz = yksOgrenciAnalizi(ogrenciler, dersler, oturumlar, {
    yks: yks, yanlisKatsayi: k, alan: girdi.alan, alanlar: girdi.alanlar
  });

  return {
    gecerli: true,
    yks: yks,
    yanlisKatsayi: k,
    tahmini: yks ? { turler: ogrAnaliz.turler, ozet: ogrAnaliz.ozet, eksikTestler: ogrAnaliz.eksikTestler } : null,
    ogrenciler: ogrAnaliz.ogrenciler,
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

/* ======================================================================
 * YKS tahmini puanları ve öğrenci analizi
 *
 * ÖSYM puanları standart puanla hesaplar (tüm adayların ortalaması ve
 * sapması kullanılır), bu yüzden okulda birebir hesaplanamaz. Burada
 * kılavuzdaki test ağırlıklarıyla 100-500 ölçeğinde ham puan tahmini yapılır:
 *   katsayı = ağırlık × 400 / testin soru sayısı
 *   puan    = 100 + Σ katsayı × test neti
 * Örn. TYT Türkçe: 0,33 × 400 / 40 = 3,3 puan/net; AYT Matematik SAY: 0,30 × 400 / 40 = 3,0.
 * Puan hesaplanma şartı (kılavuz): TYT için Türkçe veya Temel Matematikte en az 0,5 net;
 * alan puanları için TYT puanı ve ilgili AYT testlerinin en az birinde 0,5 net.
 * ====================================================================== */
var YKS_TESTLER = {
  tyt_tur: { ad: 'TYT Türkçe', soru: 40 },
  tyt_sos: { ad: 'TYT Sosyal Bilimler', soru: 20 },
  tyt_mat: { ad: 'TYT Temel Matematik', soru: 40 },
  tyt_fen: { ad: 'TYT Fen Bilimleri', soru: 20 },
  ede: { ad: 'AYT Edebiyat', soru: 24 },
  tar1: { ad: 'AYT Tarih-1', soru: 10 },
  cog1: { ad: 'AYT Coğrafya-1', soru: 6 },
  tar2: { ad: 'AYT Tarih-2', soru: 11 },
  cog2: { ad: 'AYT Coğrafya-2', soru: 11 },
  fel: { ad: 'AYT Felsefe Grubu', soru: 12 },
  din: { ad: 'AYT Din Kültürü', soru: 6 },
  mat: { ad: 'AYT Matematik', soru: 40 },
  fiz: { ad: 'AYT Fizik', soru: 14 },
  kim: { ad: 'AYT Kimya', soru: 13 },
  biy: { ad: 'AYT Biyoloji', soru: 13 },
  ydt: { ad: 'YDT Yabancı Dil', soru: 80 }
};
var YKS_TYT_PAYI = { tyt_tur: 0.13, tyt_sos: 0.07, tyt_mat: 0.13, tyt_fen: 0.07 };
var YKS_AGIRLIK = {
  TYT: { tyt_tur: 0.33, tyt_sos: 0.17, tyt_mat: 0.33, tyt_fen: 0.17 },
  SAY: { mat: 0.30, fiz: 0.10, kim: 0.10, biy: 0.10 },
  EA: { mat: 0.30, ede: 0.18, tar1: 0.07, cog1: 0.05 },
  'SÖZ': { ede: 0.18, tar1: 0.07, cog1: 0.05, tar2: 0.08, cog2: 0.08, fel: 0.09, din: 0.05 },
  'DİL': { ydt: 0.60 }
};
var YKS_ALANLAR = ['SAY', 'EA', 'SÖZ', 'DİL'];

/** Puan türündeki tüm testlerin katsayıları (TYT payı dahil). */
function yksKatsayilar(tur) {
  var w = {};
  var ekle = function (t, a) { w[t] = a * 400 / YKS_TESTLER[t].soru; };
  if (tur === 'TYT') {
    Object.keys(YKS_AGIRLIK.TYT).forEach(function (t) { ekle(t, YKS_AGIRLIK.TYT[t]); });
  } else {
    Object.keys(YKS_TYT_PAYI).forEach(function (t) { ekle(t, YKS_TYT_PAYI[t]); });
    Object.keys(YKS_AGIRLIK[tur]).forEach(function (t) { ekle(t, YKS_AGIRLIK[tur][t]); });
  }
  return w;
}

/** Bir deneme dersinin hangi YKS testine sayıldığı. */
function yksTestKodu(d) {
  var k = denemeBuyuk(d.kod);
  var on = function (dizi) { return dizi.some(function (x) { return k.indexOf(x) === 0; }); };
  if (d.oturum === 0) {
    if (on(['TÜR', 'TUR'])) return 'tyt_tur';
    if (on(['TAR', 'COĞ', 'COG', 'FEL', 'DİN', 'DIN', 'DKAB', 'SOS'])) return 'tyt_sos';
    if (on(['MAT', 'GEO'])) return 'tyt_mat';
    if (on(['FİZ', 'FIZ', 'KİM', 'KIM', 'BİY', 'BIY', 'FEN'])) return 'tyt_fen';
    return null;
  }
  var ikinci = /-2$/.test(d.kisa || '');
  if (on(['TÜR', 'TUR', 'EDE', 'EDB'])) return 'ede';
  if (on(['TAR'])) return ikinci ? 'tar2' : 'tar1';
  if (on(['COĞ', 'COG'])) return ikinci ? 'cog2' : 'cog1';
  if (on(['FEL'])) return 'fel';
  if (on(['DİN', 'DIN', 'DKAB'])) return 'din';
  if (on(['MAT', 'GEO'])) return 'mat';
  if (on(['FİZ', 'FIZ'])) return 'fiz';
  if (on(['KİM', 'KIM'])) return 'kim';
  if (on(['BİY', 'BIY'])) return 'biy';
  if (on(['İNG', 'ING', 'YDİL', 'YDIL', 'YDT', 'ALM', 'FRA', 'ARA', 'RUS'])) return 'ydt';
  return null;
}

/** Sınıf adından alan: 12-TM → EA, 12-MF / 12 FEN → SAY, 12-TS → SÖZ, 12-DİL → DİL. */
function yksSiniftanAlan(sinif) {
  var m = /([A-ZÇĞİÖŞÜ]+)\s*$/.exec(denemeBuyuk(sinif).replace(/[^A-ZÇĞİÖŞÜ0-9 ]/g, ' '));
  if (!m) return null;
  var s = m[1];
  if (s === 'TM' || s === 'EA' || s === 'EŞİT') return 'EA';
  if (s === 'MF' || s === 'FEN' || s === 'SAY' || s === 'SAYISAL') return 'SAY';
  if (s === 'TS' || s === 'SÖZ' || s === 'SOZ' || s === 'SÖZEL') return 'SÖZ';
  if (s === 'DİL' || s === 'DIL' || s === 'YD') return 'DİL';
  return null;
}

/**
 * Tahmini puanlar ve öğrenci bazında analiz.
 * secim: {
 *   alan: '' (otomatik) | 'TYT' (yalnızca TYT) | 'SAY' | ['EA', 'SÖZ'] ...   // tüm sınıf için
 *   alanlar: { 'Öğrenci Adı': ['EA', 'SÖZ'] }   // öğrenciye özel; [] = yalnızca TYT
 * }
 * TYT her öğrencide hesaplanır; seçilen alanlar AYT puan türleridir, birden fazla olabilir.
 */
function yksAlanSecimi(v, dilVar) {
  if (v === undefined || v === null || v === '' || v === 'oto') return null;
  var dizi = Object.prototype.toString.call(v) === '[object Array]' ? v : [v];
  var sonuc = [];
  YKS_ALANLAR.forEach(function (t) {
    if (dizi.indexOf(t) > -1 && (t !== 'DİL' || dilVar)) sonuc.push(t);
  });
  return sonuc;
}

function yksOgrenciAnalizi(ogrenciler, dersler, oturumlar, secim) {
  secim = secim || {};
  var yks = !!secim.yks;
  var k = secim.yanlisKatsayi > 0 ? secim.yanlisKatsayi : 0;
  var ozel = secim.alanlar || {};
  dersler.forEach(function (d) { d.test = yks ? yksTestKodu(d) : null; });
  var varTestler = {};
  dersler.forEach(function (d) { if (d.test) varTestler[d.test] = true; });
  var dilVar = !!varTestler.ydt;
  var turler = yks ? ['TYT'].concat(YKS_ALANLAR.filter(function (t) { return t !== 'DİL' || dilVar; })) : [];
  var katsayi = {};
  turler.forEach(function (t) { katsayi[t] = yksKatsayilar(t); });

  var ogrSonuc = ogrenciler.map(function (g) {
    // Test netleri ve cevaplanan soru sayıları
    var net = {};
    var cevap = {};
    var aytGirdi = !!g.oturumlar[1];
    for (var o = 0; o < g.oturumlar.length; o++) {
      if (!g.oturumlar[o]) continue;
      var grup = dersler.filter(function (d) { return d.oturum === o; });
      grup.forEach(function (d, j) {
        if (!d.test) return;
        var x = g.oturumlar[o][j];
        net[d.test] = (net[d.test] || 0) + x.net;
        cevap[d.test] = (cevap[d.test] || 0) + x.d + x.y;
      });
    }
    var tytVar = yks && !!g.oturumlar[0] && ((net.tyt_tur || 0) >= 0.5 || (net.tyt_mat || 0) >= 0.5);
    var puan = {};
    turler.forEach(function (t) {
      if (!tytVar) { puan[t] = null; return; }
      if (t !== 'TYT') {
        if (!aytGirdi) { puan[t] = null; return; }
        var ilgili = Object.keys(YKS_AGIRLIK[t]);
        if (!ilgili.some(function (x) { return (net[x] || 0) >= 0.5; })) { puan[t] = null; return; }
      }
      var p = 100;
      Object.keys(katsayi[t]).forEach(function (x) { p += Math.max(0, net[x] || 0) * katsayi[t][x]; });
      puan[t] = Math.min(500, p);
    });

    // Alanlar (birden fazla olabilir; boş dizi = yalnızca TYT)
    var alanlar = null;
    var alan = null;
    var kaynak = '';
    var elle = yks ? yksAlanSecimi(ozel[g.ad], dilVar) : null;
    var genel = yks ? yksAlanSecimi(secim.alan, dilVar) : null;
    if (!yks) { /* alan yalnızca YKS'de */ }
    else if (elle) { alanlar = elle; kaynak = 'elle seçildi'; }
    else if (genel) { alanlar = genel; kaynak = 'tüm sınıf için seçildi'; }
    else if (yksSiniftanAlan(g.sinif)) { alan = yksSiniftanAlan(g.sinif); kaynak = 'sınıf adından (' + g.sinif + ')'; }
    else if (aytGirdi) {
      var c = function (dizi) { return dizi.reduce(function (t, x) { return t + (cevap[x] || 0); }, 0); };
      if ((cevap.ydt || 0) > 0) alan = 'DİL';
      else if (c(['fiz', 'kim', 'biy']) >= 3) alan = 'SAY';
      else if (c(['tar2', 'cog2', 'fel', 'din']) >= 3 && c(['mat']) < 3) alan = 'SÖZ';
      else if (c(['mat', 'ede']) > 0) alan = 'EA';
      if (alan) kaynak = 'AYT’de cevapladığı testlerden';
    }
    if (alan === 'DİL' && !dilVar) alan = null;
    if (!alanlar) alanlar = alan ? [alan] : [];
    if (yks && !alanlar.length && kaynak) kaynak = kaynak === 'elle seçildi' || kaynak === 'tüm sınıf için seçildi' ? 'yalnızca TYT seçildi' : kaynak;
    // Ana alan: seçilenler içinde puanı en yüksek olan
    var ana = alanlar.slice().sort(function (a, b) { return (puan[b] || 0) - (puan[a] || 0); })[0] || null;
    return { g: g, net: net, puan: puan, alan: ana, alanlar: alanlar, kaynak: kaynak, otomatik: !elle && !genel };
  });

  // Sıralar: TYT puanı tüm sınıfta, alan puanı aynı alandakiler arasında
  function sirala(liste, deger) {
    var s = liste.filter(function (x) { return deger(x) !== null && deger(x) !== undefined; }).sort(function (a, b) { return deger(b) - deger(a); });
    s.forEach(function (x, i) {
      x._sira = i > 0 && Math.abs(deger(s[i - 1]) - deger(x)) < 1e-9 ? s[i - 1]._sira : i + 1;
    });
    return s.length;
  }
  var tytN = sirala(ogrSonuc, function (x) { return x.puan.TYT; });
  ogrSonuc.forEach(function (x) { x.tytSira = x.puan.TYT ? x._sira : null; x.tytN = tytN; delete x._sira; });
  ogrSonuc.forEach(function (x) { x.alanSiralari = {}; });
  YKS_ALANLAR.forEach(function (a) {
    var grup = ogrSonuc.filter(function (x) { return x.alanlar.indexOf(a) > -1; });
    var n = sirala(grup, function (x) { return x.puan[a] === undefined ? null : x.puan[a]; });
    grup.forEach(function (x) {
      x.alanSiralari[a] = { sira: x.puan[a] ? x._sira : null, n: n };
      delete x._sira;
    });
  });
  ogrSonuc.forEach(function (x) {
    var s = x.alan ? x.alanSiralari[x.alan] : null;
    x.alanSira = s ? s.sira : null;
    x.alanN = s ? s.n : 0;
  });

  // Öğrenci kartları
  var kartlar = ogrSonuc.map(function (x) {
    var g = x.g;
    // Seçilen puan türlerinde her testin en yüksek net başına puanı; alan yoksa TYT
    var alanTestleri = {};
    if (yks) {
      (x.alanlar.length ? x.alanlar : ['TYT']).forEach(function (t) {
        var kt = yksKatsayilar(t);
        Object.keys(kt).forEach(function (test) { alanTestleri[test] = Math.max(alanTestleri[test] || 0, kt[test]); });
      });
    }
    var kart = {
      ad: g.ad, sinif: g.sinif, alan: x.alan, alanlar: x.alanlar, alanKaynak: x.kaynak, alanOtomatik: x.otomatik,
      alanSiralari: x.alanSiralari,
      puanlar: x.puan,
      alanPuani: x.alan && x.puan[x.alan] ? x.puan[x.alan] : null,
      tytSira: x.tytSira, tytN: x.tytN,
      alanSira: x.alanSira || null, alanN: x.alanN || 0,
      yayinevi: g.puanlar,
      oturumlar: [],
      firsatlar: [],
      gucluler: [], zayiflar: [], oneriler: []
    };

    oturumlar.forEach(function (ot, o) {
      var s = g.oturumlar[o];
      if (!s || !ot.n) { kart.oturumlar.push(null); return; }
      var grup = dersler.filter(function (d) { return d.oturum === o; });
      var sira = null;
      ot.siralama.forEach(function (r) { if (r.ad === g.ad && sira === null) sira = r.sira; });
      var toplam = s.reduce(function (t, r) { return t + r.net; }, 0);
      kart.oturumlar.push({
        ad: ot.ad, sira: sira, n: ot.n, net: toplam, sinifOrt: ot.ortalamaNet, soru: ot.soruSayisi,
        dersler: grup.map(function (d, j) {
          var r = s[j];
          var sinifOrt = ot.dersler[j].ortNet;
          var esik = Math.max(1, d.soru * 0.1);
          var fark = r.net - sinifOrt;
          var basari = d.soru > 0 ? r.net / d.soru : 0;
          return {
            kod: d.kisa, ad: d.ad, soru: d.soru, d: r.d, y: r.y, b: r.b, net: r.net,
            sinifOrt: sinifOrt, fark: fark,
            karsilastirma: fark >= esik ? 'üstünde' : fark <= -esik ? 'altında' : 'düzeyinde',
            basari: basari, basariEtiket: denemeBasariEtiketi(basari),
            alanda: yks ? !!(d.test && alanTestleri[d.test]) : true,
            turler: yks && d.test ? x.alanlar.filter(function (t) { return yksKatsayilar(t)[d.test] && YKS_AGIRLIK[t][d.test]; }) : [],
            puanNet: d.test && alanTestleri[d.test] ? alanTestleri[d.test] : 0
          };
        })
      });
    });

    // Değerlendirme
    var tumDersler = [];
    kart.oturumlar.forEach(function (ot) { if (ot) ot.dersler.forEach(function (d) { d.oturum = ot.ad; tumDersler.push(d); }); });
    var adi = function (d) { return kart.oturumlar.filter(function (z) { return z; }).length > 1 ? d.oturum + ' ' + d.ad : d.ad; };

    // Güçlü dersler: başarısı %60 ve üstü ya da sınıfın belirgin üstünde (%30 ve üstü başarıyla)
    kart.gucluler = tumDersler.filter(function (d) {
      return d.soru >= 5 && (d.basari >= DENEME_IYI || (d.karsilastirma === 'üstünde' && d.basari >= DENEME_DUSUK));
    }).sort(function (a, b) { return b.basari - a.basari; }).slice(0, 4).map(function (d) {
      return { ad: adi(d), basari: d.basari, net: d.net, soru: d.soru };
    });
    // Öncelikli dersler: alana sayılan, başarısı düşük ya da sınıfın altında; puana etkisine göre sıralı
    kart.zayiflar = tumDersler.filter(function (d) {
      return d.alanda && d.soru >= 5 && (d.karsilastirma === 'altında' || d.basari < DENEME_DUSUK);
    }).map(function (d) {
      var kalan = Math.max(0, d.soru - Math.max(0, d.net));
      return { ad: adi(d), basari: d.basari, net: d.net, soru: d.soru, etki: kalan * (yks ? d.puanNet : 1), puanNet: d.puanNet };
    }).sort(function (a, b) { return b.etki - a.etki; });

    // Puan fırsatları: alan puanına en çok katkı verecek testler (kalan net × puan/net)
    Object.keys(alanTestleri).forEach(function (t) {
      if (!varTestler[t]) return;
      var kalan = Math.max(0, YKS_TESTLER[t].soru - Math.max(0, x.net[t] || 0));
      if (kalan <= 0) return;
      kart.firsatlar.push({ test: YKS_TESTLER[t].ad, net: x.net[t] || 0, soru: YKS_TESTLER[t].soru, puanNet: alanTestleri[t], kalanPuan: kalan * alanTestleri[t] });
    });
    kart.firsatlar.sort(function (a, b) { return b.kalanPuan - a.kalanPuan; });
    kart.firsatlar = kart.firsatlar.slice(0, 4);

    // Öneriler (sade, uygulanabilir cümleler)
    var yanlisCok = tumDersler.filter(function (d) { return d.y >= 3 && d.y / Math.max(1, d.d + d.y) >= DENEME_YANLIS_UYARI; })
      .sort(function (a, b) { return b.y - a.y; });
    yanlisCok.slice(0, 3).forEach(function (d) {
      kart.oneriler.push(adi(d) + ': ' + d.y + ' yanlış' + (k ? ', ' + denemeYazi(d.y / k) + ' neti götürdü' : '') +
        '. Cevapların çoğu yanlış; emin olunmayan sorular boş bırakılırsa net artar.');
    });
    if (yks && !g.oturumlar[1] && g.oturumlar[0]) {
      kart.oneriler.push('AYT oturumuna girmemiş; alan puanı hesaplanamadı.');
    }
    var hicYok = tumDersler.filter(function (d) { return d.alanda && d.soru >= 5 && d.b / d.soru >= 0.8; })
      .sort(function (a, b) { return (b.soru * (b.puanNet || 1)) - (a.soru * (a.puanNet || 1)); });
    if (hicYok.length) {
      kart.oneriler.push((yks ? 'Alan puanına sayılan ama neredeyse' : 'Neredeyse') + ' hiç cevaplanmayan dersler: ' +
        hicYok.slice(0, 4).map(adi).join(', ') + (hicYok.length > 4 ? ' ve ' + (hicYok.length - 4) + ' ders daha' : '') +
        '. Bu derslerin temel konularından başlamak neti en hızlı artıran yol olabilir.');
    }
    var altinda = tumDersler.filter(function (d) { return d.karsilastirma === 'altında'; })
      .sort(function (a, b) { return a.fark - b.fark; }).slice(0, 4);
    if (altinda.length) {
      kart.oneriler.push('Sınıf ortalamasının altında kaldığı dersler: ' + altinda.map(function (d) {
        return adi(d) + ' (' + denemeYazi(d.net) + ' / sınıf ' + denemeYazi(d.sinifOrt) + ')';
      }).join(', ') + '.');
    }
    if (kart.firsatlar.length) {
      var f0 = kart.firsatlar[0];
      kart.oneriler.push((x.alanlar.length ? x.alanlar.join(' / ') + ' puanına' : 'TYT puanına') + ' en çok katkı ' + f0.test + ' testinden gelir: her net yaklaşık ' +
        denemeYazi(f0.puanNet) + ' puan.');
    }
    if (yks && x.alan && x.puan[x.alan]) {
      var daha = YKS_ALANLAR.filter(function (t) { return x.alanlar.indexOf(t) < 0 && x.puan[t] && x.puan[t] - x.puan[x.alan] >= 10; })
        .sort(function (a, b) { return x.puan[b] - x.puan[a]; });
      if (daha.length) {
        kart.oneriler.push('Bu denemede ' + daha[0] + ' puanı (' + denemeYazi(Math.round(x.puan[daha[0]] * 10) / 10) + '), ' + x.alan +
          ' puanından (' + denemeYazi(Math.round(x.puan[x.alan] * 10) / 10) + ') belirgin yüksek. Alan tercihi rehberlikle konuşulabilir.');
      }
    }
    if (yks && g.oturumlar[1] && x.puan.TYT) {
      x.alanlar.filter(function (t) { return !x.puan[t]; }).forEach(function (t) {
        kart.oneriler.push(t + ' puanı hesaplanamadı: ' + t + ' puanına sayılan AYT testlerinin hiçbirinde 0,5 net yok.');
      });
    }
    if (yks && !x.alanlar.length && x.otomatik && g.oturumlar[1]) kart.oneriler.push('Alan belirlenemedi; alan puanı için öğrencinin alanını seçin.');
    return kart;
  });

  // Sınıf geneli tahmini puan ortalamaları
  var ozet = turler.map(function (t) {
    var v = kartlar.map(function (k) { return k.puanlar[t]; }).filter(function (p) { return p !== null && p !== undefined; });
    var alanV = t === 'TYT' ? v : kartlar.filter(function (k) { return k.alanlar.indexOf(t) > -1 && k.puanlar[t] !== null; }).map(function (k) { return k.puanlar[t]; });
    return { ad: t, n: v.length, ortalama: denemeOrtalama(v), alanN: alanV.length, alanOrtalama: denemeOrtalama(alanV), enYuksek: v.length ? Math.max.apply(null, v) : 0 };
  });

  return {
    turler: turler,
    ozet: ozet,
    ogrenciler: kartlar,
    katsayilar: katsayi,
    eksikTestler: Object.keys(YKS_TESTLER).filter(function (t) {
      return !varTestler[t] && t !== 'ydt' && turler.some(function (tur) { return katsayi[tur][t]; });
    }).map(function (t) { return YKS_TESTLER[t].ad; })
  };
}

function denemeYazi(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
