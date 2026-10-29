/**
 * Okul verileri: sınıflar, dersler, öğretmenler, öğrenciler, ders atamaları ve öğrenci değerlendirme notları.
 *
 * Kapsam: okula bağlı kullanıcılar okulun verisini, okulsuz öğretmen/admin kendi kişisel verisini kullanır.
 * Admin herhangi bir okulun verisini seçebilir.
 * Depolama: kapsam başına bir Google E-Tablo (script sahibinin Drive'ında, ilk kullanımda oluşturulur).
 * Sayfalar okunabilir başlıklarla tutulur; "(ad)" sütunları yalnızca E-Tabloda okumayı kolaylaştırır,
 * uygulama kimlik sütunlarını kullanır.
 *
 * Yetki:
 *   - okumak: öğretmen, yönetici, admin (öğrenciler göremez)
 *   - listeleri düzenlemek: admin, okulun yöneticisi, kişisel kapsamın sahibi
 *   - not göndermek: "degerlendirme" aracı açık olan herkes (öğrenci hariç)
 *   - tüm notları görmek, gönderilmiş notu değiştirmek/silmek: düzenleme yetkisi olanlar
 */
var VERI_TABLOLAR = {
  siniflar: { sayfa: 'Sınıflar', alanlar: ['id', 'ad', 'sira'], basliklar: ['Kimlik', 'Sınıf', 'Sıra'] },
  dersler: { sayfa: 'Dersler', alanlar: ['id', 'ad', 'sira'], basliklar: ['Kimlik', 'Ders', 'Sıra'] },
  ogretmenler: { sayfa: 'Öğretmenler', alanlar: ['id', 'ad', 'brans', 'kullanici'], basliklar: ['Kimlik', 'Ad Soyad', 'Branş', 'Uygulama kullanıcı adı'] },
  ogrenciler: { sayfa: 'Öğrenciler', alanlar: ['id', 'no', 'ad', 'sinif', 'mentor'], basliklar: ['Kimlik', 'No', 'Ad Soyad', 'Sınıf kimliği', 'Mentör kimliği', 'Sınıf (ad)', 'Mentör (ad)'] },
  atamalar: { sayfa: 'Ders atamaları', alanlar: ['id', 'ogretmen', 'ders', 'sinif', 'saat'], basliklar: ['Kimlik', 'Öğretmen kimliği', 'Ders kimliği', 'Sınıf kimliği', 'Haftalık saat', 'Öğretmen (ad)', 'Ders (ad)', 'Sınıf (ad)'] }
};
var VERI_NOT = {
  sayfa: 'Değerlendirmeler',
  alanlar: ['id', 'donem', 'sinif', 'sinifAd', 'ogrenci', 'ogrenciAd', 'ders', 'dersAd', 'ogretmen', 'ogretmenAd', 'metin', 'tarih', 'gun', 'saat', 'olusturma', 'duzenleme'],
  basliklar: ['Kimlik', 'Dönem', 'Sınıf kimliği', 'Sınıf', 'Öğrenci kimliği', 'Öğrenci', 'Ders kimliği', 'Ders', 'Öğretmen kullanıcı adı', 'Öğretmen', 'Not', 'Tarih', 'Gün', 'Saat', 'Oluşturma (ISO)', 'Son düzenleme']
};
var VERI_SINIR = { siniflar: 200, dersler: 200, ogretmenler: 500, ogrenciler: 5000, atamalar: 5000 };
var VERI_GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/* ---------- Kapsam ve yetki ---------- */

function veriKapsam(token, okulId) {
  var s = rolOturum(token);
  var rol = s.bilgi.rol;
  if (rol === 'ogrenci') throw new Error('Bu bölüm öğrencilere açık değil.');
  var kendiOkul = s.u.okul && rolOkulOku(s.u.okul) ? s.u.okul : null;
  var id = okulId || null;
  if (id && id.indexOf('k:') === 0) id = null; // kişisel kapsam açıkça istendi
  if (id) {
    if (!rolOkulOku(id)) throw new Error('Okul bulunamadı.');
    if (rol !== 'admin' && id !== kendiOkul) throw new Error('Bu okulun verilerine erişiminiz yok.');
  } else if (!okulId) {
    id = kendiOkul;
  }
  var k;
  if (id) {
    var duzenle = rol === 'admin' || (rol === 'yonetici' && id === kendiOkul);
    k = { anahtar: 'o:' + id, tur: 'okul', okulId: id, ad: rolOkulOku(id).ad, duzenle: duzenle };
  } else {
    if (rol !== 'admin' && kendiOkul) throw new Error('Okulunuzun verilerini kullanın.');
    k = { anahtar: 'k:' + s.k, tur: 'kisisel', okulId: null, ad: 'Kişisel', duzenle: true };
  }
  k.s = s;
  return k;
}

/* ---------- E-Tablo ---------- */

function veriTabloAc(kap) {
  var sp = authSp();
  var anahtar = 'tablo:' + kap.anahtar;
  var id = sp.getProperty(anahtar);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* silinmiş: yenisi açılır */ }
  }
  var ad = kap.tur === 'okul' ? kap.ad : (kap.s.u.ad || kap.s.k) + ' (kişisel)';
  var ss = SpreadsheetApp.create('MD Education Asist - ' + ad);
  sp.setProperty(anahtar, ss.getId());
  var ilk = ss.getSheets()[0];
  ilk.setName(VERI_TABLOLAR.siniflar.sayfa);
  return ss;
}

function veriSayfa(ss, tanim) {
  var sh = ss.getSheetByName(tanim.sayfa);
  if (!sh) sh = ss.insertSheet(tanim.sayfa);
  if (sh.getLastRow() < 1) {
    sh.getRange(1, 1, 1, tanim.basliklar.length).setValues([tanim.basliklar]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function veriHucre(v) {
  var s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function veriSatirlariOku(ss, tanim) {
  var sh = veriSayfa(ss, tanim);
  var son = sh.getLastRow();
  if (son < 2) return [];
  return sh.getRange(2, 1, son - 1, tanim.alanlar.length).getValues().map(function (r) {
    var o = {};
    tanim.alanlar.forEach(function (a, i) { o[a] = String(r[i] == null ? '' : r[i]).replace(/^'/, ''); });
    return o;
  }).filter(function (o) { return o.id; });
}

function veriSatirlariYaz(ss, tanim, liste, ekSutunlar) {
  var sh = veriSayfa(ss, tanim);
  var genislik = tanim.basliklar.length;
  var son = sh.getLastRow();
  if (son > 1) sh.getRange(2, 1, son - 1, genislik).clearContent();
  if (!liste.length) return;
  var satirlar = liste.map(function (o) {
    var r = tanim.alanlar.map(function (a) { return veriHucre(o[a]); });
    if (ekSutunlar) r = r.concat(ekSutunlar(o).map(veriHucre));
    while (r.length < genislik) r.push('');
    return r;
  });
  sh.getRange(2, 1, satirlar.length, genislik).setNumberFormat('@').setValues(satirlar);
}

/* ---------- Okuma ---------- */

function veriHamOku(kap) {
  var onb = CacheService.getScriptCache();
  var ham = onb.get('veri:' + kap.anahtar);
  if (ham) { try { return JSON.parse(ham); } catch (e) {} }
  var ss = veriTabloAc(kap);
  var v = { url: ss.getUrl() };
  Object.keys(VERI_TABLOLAR).forEach(function (t) { v[t] = veriSatirlariOku(ss, VERI_TABLOLAR[t]); });
  veriOnbellegeYaz(kap, v);
  return v;
}

function veriOnbellegeYaz(kap, v) {
  var metin = JSON.stringify(v);
  var onb = CacheService.getScriptCache();
  if (metin.length < 90000) onb.put('veri:' + kap.anahtar, metin, 600);
  else onb.remove('veri:' + kap.anahtar);
}

function veriSirala(v) {
  var tr = function (a, b) { return String(a).localeCompare(String(b), 'tr'); };
  var sira = function (a, b) { return (Number(a.sira) || 0) - (Number(b.sira) || 0) || tr(a.ad, b.ad); };
  v.siniflar.sort(sira);
  v.dersler.sort(sira);
  v.ogretmenler.sort(function (a, b) { return tr(a.ad, b.ad); });
  v.ogrenciler.sort(function (a, b) {
    if (!a.no !== !b.no) return a.no ? -1 : 1; // numarasızlar sonda
    var na = Number(a.no), nb = Number(b.no);
    if (a.no && b.no && !isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return tr(a.no, b.no) || tr(a.ad, b.ad);
  });
  return v;
}

function veriYanit(kap, v) {
  var s = kap.s;
  var benOgretmen = v.ogretmenler.filter(function (o) { return o.kullanici && o.kullanici === s.k; })[0];
  var r = {
    ok: true,
    kapsam: { anahtar: kap.anahtar, tur: kap.tur, okulId: kap.okulId, ad: kap.ad },
    duzenle: kap.duzenle,
    ben: { kullanici: s.k, ad: s.u.ad, ogretmenId: benOgretmen ? benOgretmen.id : null, rol: s.bilgi.rol },
    siniflar: v.siniflar, dersler: v.dersler, ogretmenler: v.ogretmenler, ogrenciler: v.ogrenciler,
    atamalar: v.atamalar.map(function (a) { var x = {}; for (var k in a) x[k] = a[k]; x.saat = Number(a.saat) || 0; return x; }),
    uyeler: [], okullar: []
  };
  if (!kap.duzenle) {
    // Okul öğretmenleri listeleri okur; E-Tablo adresi ve hesap listesi yalnızca düzenleyenlere.
    return veriSirala(r);
  }
  r.tabloUrl = v.url;
  if (kap.tur === 'okul') {
    r.uyeler = rolTumKullanicilar().filter(function (x) { return x.u.okul === kap.okulId; })
      .map(function (x) { return { kullanici: x.k, ad: x.u.ad, rol: rolEtkin(x.k, x.u) }; })
      .filter(function (x) { return x.rol !== 'ogrenci'; });
  }
  if (s.bilgi.rol === 'admin') {
    r.okullar = authSp().getKeys().filter(function (a) { return a.indexOf('okul:') === 0; })
      .map(function (a) { var o = rolOku(a); return { id: a.slice(5), ad: o ? o.ad : a }; });
  }
  return veriSirala(r);
}

function veriOkuIslem(token, okulId) {
  var kap = veriKapsam(token, okulId);
  return veriYanit(kap, veriHamOku(kap));
}

/* ---------- Doğrulama ---------- */

function veriMetin(s, en) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, en); }
function veriAnahtar(s) { return veriMetin(s, 200).toLocaleLowerCase('tr-TR'); }
function veriYeniId(on) { return on + Utilities.getUuid().replace(/-/g, '').slice(0, 10); }

/** Bir kaydı tablonun kurallarına göre temizler; geçersizse hata metni döner. */
function veriTemizle(tur, o, v) {
  var var_ = function (liste, id) { return liste.some(function (x) { return x.id === id; }); };
  if (tur === 'siniflar' || tur === 'dersler') {
    var ad = veriMetin(o.ad, tur === 'siniflar' ? 40 : 60);
    if (!ad) return { hata: tur === 'siniflar' ? 'Sınıf adı boş olamaz.' : 'Ders adı boş olamaz.' };
    return { ad: ad, sira: String(Number(o.sira) || 0) };
  }
  if (tur === 'ogretmenler') {
    var oad = veriMetin(o.ad, 80);
    if (oad.length < 2) return { hata: 'Öğretmenin adını yazın.' };
    var k = o.kullanici ? authKullaniciNormal(o.kullanici) : '';
    return { ad: oad, brans: veriMetin(o.brans, 60), kullanici: k };
  }
  if (tur === 'ogrenciler') {
    var gad = veriMetin(o.ad, 80);
    if (gad.length < 2) return { hata: 'Öğrencinin adını yazın.' };
    var sinif = String(o.sinif || '');
    if (sinif && !var_(v.siniflar, sinif)) return { hata: 'Sınıf bulunamadı.' };
    var mentor = String(o.mentor || '');
    if (mentor && !var_(v.ogretmenler, mentor)) return { hata: 'Mentör öğretmen bulunamadı.' };
    return { no: veriMetin(o.no, 12), ad: gad, sinif: sinif, mentor: mentor };
  }
  if (tur === 'atamalar') {
    if (!var_(v.ogretmenler, String(o.ogretmen || ''))) return { hata: 'Öğretmen bulunamadı.' };
    if (!var_(v.dersler, String(o.ders || ''))) return { hata: 'Ders bulunamadı.' };
    if (!var_(v.siniflar, String(o.sinif || ''))) return { hata: 'Sınıf bulunamadı.' };
    var saat = Math.round(Number(o.saat) || 0);
    if (saat < 0 || saat > 40) return { hata: 'Haftalık saat 0 ile 40 arasında olmalı.' };
    return { ogretmen: String(o.ogretmen), ders: String(o.ders), sinif: String(o.sinif), saat: String(saat) };
  }
  return { hata: 'Bilinmeyen liste.' };
}

/** Aynı kaydın ikinci kez eklenmesini önleyen anahtar (yoksa null: tekrar serbest). */
function veriTekrarAnahtari(tur, o) {
  if (tur === 'siniflar' || tur === 'dersler') return veriAnahtar(o.ad);
  if (tur === 'atamalar') return [o.ogretmen, o.ders, o.sinif].join('|');
  if (tur === 'ogrenciler') return o.no ? 'no:' + veriAnahtar(o.no) : null;
  return null;
}

/* ---------- Yazma ---------- */

/**
 * islem = { ekle: [kayıt], guncelle: [kayıt (id ile)], sil: [id] }
 * Silmede bağlı kayıtlar düzeltilir: sınıf silinince öğrencileri sınıfsız kalır ve atamaları silinir,
 * öğretmen silinince mentörlükleri ve atamaları, ders silinince atamaları kalkar.
 */
function veriKaydetIslem(token, okulId, tur, islem) {
  if (!VERI_TABLOLAR[tur]) return { ok: false, hata: 'Bilinmeyen liste.' };
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  try {
    var kap = veriKapsam(token, okulId);
    if (!kap.duzenle) return { ok: false, hata: 'Bu listeleri yalnızca okul yöneticisi düzenleyebilir.' };
    CacheService.getScriptCache().remove('veri:' + kap.anahtar);
    var ss = veriTabloAc(kap);
    var v = { url: ss.getUrl() };
    Object.keys(VERI_TABLOLAR).forEach(function (t) { v[t] = veriSatirlariOku(ss, VERI_TABLOLAR[t]); });
    var degisen = {}, hatalar = [], eklenen = [], atlanan = 0;
    islem = islem || {};

    (islem.sil || []).forEach(function (id) {
      id = String(id);
      var once = v[tur].length;
      v[tur] = v[tur].filter(function (x) { return x.id !== id; });
      if (v[tur].length === once) return;
      degisen[tur] = 1;
      if (tur === 'siniflar') {
        v.ogrenciler.forEach(function (o) { if (o.sinif === id) { o.sinif = ''; degisen.ogrenciler = 1; } });
        v.atamalar = v.atamalar.filter(function (a) { if (a.sinif === id) { degisen.atamalar = 1; return false; } return true; });
      } else if (tur === 'dersler') {
        v.atamalar = v.atamalar.filter(function (a) { if (a.ders === id) { degisen.atamalar = 1; return false; } return true; });
      } else if (tur === 'ogretmenler') {
        v.ogrenciler.forEach(function (o) { if (o.mentor === id) { o.mentor = ''; degisen.ogrenciler = 1; } });
        v.atamalar = v.atamalar.filter(function (a) { if (a.ogretmen === id) { degisen.atamalar = 1; return false; } return true; });
      }
    });

    (islem.guncelle || []).forEach(function (o) {
      var hedef = v[tur].filter(function (x) { return x.id === String(o && o.id); })[0];
      if (!hedef) { hatalar.push('Kayıt bulunamadı (silinmiş olabilir).'); return; }
      var birlesik = {};
      VERI_TABLOLAR[tur].alanlar.forEach(function (a) { birlesik[a] = Object.prototype.hasOwnProperty.call(o, a) ? o[a] : hedef[a]; });
      var t = veriTemizle(tur, birlesik, v);
      if (t.hata) { hatalar.push(t.hata); return; }
      var tekrar = veriTekrarAnahtari(tur, t);
      if (tekrar && v[tur].some(function (x) { return x.id !== hedef.id && veriTekrarAnahtari(tur, x) === tekrar; })) {
        hatalar.push(tur === 'ogrenciler' ? 'Bu numara başka bir öğrencide kayıtlı.' : 'Bu ad zaten var.');
        return;
      }
      for (var a in t) hedef[a] = t[a];
      degisen[tur] = 1;
    });

    var ekle = (islem.ekle || []).slice(0, 1000);
    ekle.forEach(function (o) {
      if (v[tur].length >= VERI_SINIR[tur]) { hatalar.push('Liste sınırına ulaşıldı (' + VERI_SINIR[tur] + ').'); return; }
      var t = veriTemizle(tur, o || {}, v);
      if (t.hata) { hatalar.push(t.hata); return; }
      var tekrar = veriTekrarAnahtari(tur, t);
      var mevcut = tekrar ? v[tur].filter(function (x) { return veriTekrarAnahtari(tur, x) === tekrar; })[0] : null;
      if (mevcut) {
        if (tur === 'atamalar') { mevcut.saat = t.saat; degisen[tur] = 1; eklenen.push(mevcut.id); }
        else atlanan++;
        return;
      }
      t.id = veriYeniId({ siniflar: 's', dersler: 'd', ogretmenler: 't', ogrenciler: 'o', atamalar: 'a' }[tur]);
      if ((tur === 'siniflar' || tur === 'dersler') && !Number(t.sira)) {
        t.sira = String(v[tur].reduce(function (m, x) { return Math.max(m, Number(x.sira) || 0); }, 0) + 1);
      }
      var kayit = {};
      VERI_TABLOLAR[tur].alanlar.forEach(function (a) { kayit[a] = a === 'id' ? t.id : (t[a] || ''); });
      v[tur].push(kayit);
      eklenen.push(kayit.id);
      degisen[tur] = 1;
    });

    var ad = function (liste, id) { var x = liste.filter(function (y) { return y.id === id; })[0]; return x ? x.ad : ''; };
    var ekler = {
      ogrenciler: function (o) { return [ad(v.siniflar, o.sinif), ad(v.ogretmenler, o.mentor)]; },
      atamalar: function (a) { return [ad(v.ogretmenler, a.ogretmen), ad(v.dersler, a.ders), ad(v.siniflar, a.sinif)]; }
    };
    // Ad değişince okunabilir "(ad)" sütunları da yenilensin
    if (degisen.siniflar || degisen.ogretmenler) { degisen.ogrenciler = 1; degisen.atamalar = 1; }
    if (degisen.dersler) degisen.atamalar = 1;
    Object.keys(degisen).forEach(function (t) { veriSatirlariYaz(ss, VERI_TABLOLAR[t], v[t], ekler[t]); });
    veriOnbellegeYaz(kap, v);

    var r = veriYanit(kap, v);
    r.eklenen = eklenen;
    r.atlanan = atlanan;
    if (hatalar.length) r.uyarilar = hatalar.filter(function (h, i, d) { return d.indexOf(h) === i; });
    return r;
  } finally {
    kilit.releaseLock();
  }
}

/* ---------- Öğrenci değerlendirme notları ---------- */

/** Türkiye saatiyle (UTC+3) tarih parçaları ve dönem: Ağustos–Ocak 1. dönem, Şubat–Temmuz 2. dönem. */
function veriZaman(d) {
  var t = new Date(d.getTime() + 3 * 3600 * 1000);
  var iki = function (n) { return (n < 10 ? '0' : '') + n; };
  var ay = t.getUTCMonth() + 1, yil = t.getUTCFullYear();
  var bas = ay >= 8 ? yil : yil - 1;
  return {
    donem: bas + '-' + (bas + 1) + ' ' + (ay >= 2 && ay <= 7 ? '2. Dönem' : '1. Dönem'),
    tarih: iki(t.getUTCDate()) + '.' + iki(ay) + '.' + yil,
    gun: VERI_GUNLER[t.getUTCDay()],
    saat: iki(t.getUTCHours()) + ':' + iki(t.getUTCMinutes()),
    iso: d.toISOString()
  };
}

function veriDgKapsam(token, okulId) {
  var kap = veriKapsam(token, okulId);
  if (kap.s.bilgi.araclar.indexOf('degerlendirme') < 0) throw new Error('Bu araç hesabınıza açık değil.');
  return kap;
}

function veriDgDurum(token, okulId, sinif, ders) {
  var kap = veriDgKapsam(token, okulId);
  var ss = veriTabloAc(kap);
  var donem = veriZaman(new Date()).donem;
  var gonderilen = veriSatirlariOku(ss, VERI_NOT).filter(function (n) {
    return n.donem === donem && n.sinif === String(sinif) && n.ders === String(ders);
  }).map(function (n) { return n.ogrenci; });
  return { ok: true, donem: donem, gonderilen: gonderilen };
}

/** Öğretmenin tamamladığı notları tek seferde gönderir; aynı dönemde aynı öğrenci + ders için ikinci not eklenmez. */
function veriDgGonder(token, okulId, paket) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  try {
    var kap = veriDgKapsam(token, okulId);
    paket = paket || {};
    var v = veriHamOku(kap);
    var sinif = v.siniflar.filter(function (x) { return x.id === String(paket.sinif); })[0];
    var ders = v.dersler.filter(function (x) { return x.id === String(paket.ders); })[0];
    if (!sinif || !ders) return { ok: false, hata: 'Sınıf ya da ders bulunamadı. Sayfayı yenileyin.' };
    var ogr = {};
    v.ogrenciler.forEach(function (o) { if (o.sinif === sinif.id) ogr[o.id] = o; });
    var ss = veriTabloAc(kap);
    var z = veriZaman(new Date());
    var notlar = veriSatirlariOku(ss, VERI_NOT);
    var mevcut = {};
    notlar.forEach(function (n) { if (n.donem === z.donem && n.sinif === sinif.id && n.ders === ders.id) mevcut[n.ogrenci] = 1; });
    var eklenen = [], atlanan = [];
    (paket.notlar || []).slice(0, 200).forEach(function (n) {
      var o = ogr[String(n && n.ogrenci)];
      var metin = String(n && n.metin || '').trim().slice(0, 6000);
      if (!o || !metin) return;
      if (mevcut[o.id]) { atlanan.push(o.id); return; }
      mevcut[o.id] = 1;
      notlar.push({
        id: veriYeniId('n'), donem: z.donem, sinif: sinif.id, sinifAd: sinif.ad, ogrenci: o.id, ogrenciAd: o.ad,
        ders: ders.id, dersAd: ders.ad, ogretmen: kap.s.k, ogretmenAd: kap.s.u.ad || kap.s.k, metin: metin,
        tarih: z.tarih, gun: z.gun, saat: z.saat, olusturma: z.iso, duzenleme: ''
      });
      eklenen.push(o.id);
    });
    if (eklenen.length) veriSatirlariYaz(ss, VERI_NOT, notlar);
    return { ok: true, eklenen: eklenen, atlanan: atlanan };
  } finally {
    kilit.releaseLock();
  }
}

function veriDgYonetici(token, okulId) {
  var kap = veriDgKapsam(token, okulId);
  if (!kap.duzenle) throw new Error('Tüm notları yalnızca okul yöneticisi görebilir.');
  return kap;
}

function veriDgHepsi(token, okulId) {
  var kap = veriDgYonetici(token, okulId);
  var ss = veriTabloAc(kap);
  return { ok: true, donem: veriZaman(new Date()).donem, notlar: veriSatirlariOku(ss, VERI_NOT), tabloUrl: ss.getUrl() };
}

function veriDgDuzenle(token, okulId, id, metin) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  try {
    var kap = veriDgYonetici(token, okulId);
    var temiz = String(metin || '').trim().slice(0, 6000);
    if (!temiz) return { ok: false, hata: 'Not boş olamaz.' };
    var ss = veriTabloAc(kap);
    var notlar = veriSatirlariOku(ss, VERI_NOT);
    var n = notlar.filter(function (x) { return x.id === String(id); })[0];
    if (!n) return { ok: false, hata: 'Not bulunamadı (silinmiş olabilir).' };
    var z = veriZaman(new Date());
    n.metin = temiz;
    n.duzenleme = z.tarih + ' ' + z.gun + ' ' + z.saat;
    veriSatirlariYaz(ss, VERI_NOT, notlar);
    return { ok: true, not: n };
  } finally {
    kilit.releaseLock();
  }
}

function veriDgSil(token, okulId, idler) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  try {
    var kap = veriDgYonetici(token, okulId);
    var sil = {};
    (Array.isArray(idler) ? idler : [idler]).forEach(function (x) { sil[String(x)] = 1; });
    var ss = veriTabloAc(kap);
    var notlar = veriSatirlariOku(ss, VERI_NOT);
    var kalan = notlar.filter(function (n) { return !sil[n.id]; });
    if (kalan.length !== notlar.length) veriSatirlariYaz(ss, VERI_NOT, kalan);
    return { ok: true, silinen: notlar.length - kalan.length };
  } finally {
    kilit.releaseLock();
  }
}
