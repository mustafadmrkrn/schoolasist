/**
 * Anaokulu Dönem Notları — Google Apps Script sunucusu.
 *
 * Kurulum (bir kez):
 *  1. Yeni bir Google E-Tablo açın (ör. "Anaokulu Dönem Notları").
 *  2. Uzantılar > Apps Script. Açılan Kod.gs içeriğini silip bu dosyanın tamamını yapıştırın.
 *  3. Aşağıdaki YONETICI_SIFRE değerine kendi şifrenizi yazın, kaydedin.
 *     (Bu dosya herkese açık depoda şifresiz durur; şifre yalnızca sizin Apps Script projenizde olur.)
 *  4. Dağıt > Yeni dağıtım > Tür: Web uygulaması
 *       Şu kullanıcı olarak çalıştır: Ben
 *       Erişimi olan kullanıcılar: Herkes
 *     Dağıt'a basın, izinleri onaylayın, "Web uygulaması URL'sini" kopyalayın.
 *  5. Bu URL'yi docs/yorum/ayar.js içindeki API_URL alanına yazın.
 *
 * Kodu değiştirirseniz: Dağıt > Dağıtımları yönet > Düzenle > Sürüm: Yeni sürüm (URL değişmez).
 */

var YONETICI_SIFRE = 'BURAYA-SIFRENIZI-YAZIN';
var SAYFA_ADI = 'Notlar';
var SAAT_DILIMI = 'Europe/Istanbul';
var GUNLER = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
var BASLIK = ['ID', 'Dönem', 'Şube', 'Öğrenci', 'Ders', 'Öğretmen', 'Not',
              'Tarih', 'Gün', 'Saat', 'Oluşturma (ISO)', 'Son Düzenleme', 'Anahtar'];
var C = { id: 0, donem: 1, sube: 2, ogrenci: 3, ders: 4, ogretmen: 5, not: 6, tarih: 7, gun: 8, saat: 9, iso: 10, duz: 11, anahtar: 12 };
var AZAMI_HATA = 8;          // bu kadar hatalı şifreden sonra
var KILIT_SANIYE = 15 * 60;  // 15 dakika yönetici girişi kapanır

function doGet() {
  return cevap_({ ok: true, mesaj: 'Sunucu çalışıyor.' });
}

function doPost(e) {
  var veri = {};
  try { veri = JSON.parse(e.postData.contents || '{}'); }
  catch (hata) { return cevap_({ ok: false, hata: 'Geçersiz istek.' }); }
  return cevap_(isle_(veri));
}

function cevap_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(ContentService.MimeType.JSON);
}

function isle_(v) {
  try {
    switch (v.islem) {
      case 'toplu_ekle': return kilitli_(function () { return topluEkle_(v); });
      case 'durum': return durum_(v);
      case 'duzenle': return kilitli_(function () { return duzenle_(v); });
      case 'sil': return kilitli_(function () { return sil_(v); });
      case 'hepsi': return hepsi_(v);
      case 'toplu_sil': return kilitli_(function () { return topluSil_(v); });
      default: return { ok: false, hata: 'Bilinmeyen işlem.' };
    }
  } catch (hata) {
    return { ok: false, hata: String(hata && hata.message ? hata.message : hata) };
  }
}

function kilitli_(fn) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  try { return fn(); } finally { kilit.releaseLock(); }
}

function sayfa_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SAYFA_ADI);
  if (!sh) {
    sh = ss.insertSheet(SAYFA_ADI);
    sh.appendRow(BASLIK);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, BASLIK.length).setFontWeight('bold').setBackground('#EDE7F6');
    sh.setColumnWidth(C.not + 1, 460);
    sh.hideColumns(C.anahtar + 1);
  }
  return sh;
}

/* ---------- Yönetici şifresi ve deneme sınırı ---------- */
function yoneticiMi_(sifre) {
  if (!sifre) return false;
  var cache = CacheService.getScriptCache();
  var hata = Number(cache.get('hatali') || 0);
  if (hata >= AZAMI_HATA) throw new Error('Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.');
  if (String(sifre) === String(YONETICI_SIFRE) && YONETICI_SIFRE !== 'BURAYA-SIFRENIZI-YAZIN') return true;
  cache.put('hatali', String(hata + 1), KILIT_SANIYE);
  return false;
}

function temizle_(s, uzunluk) {
  s = String(s == null ? '' : s).trim();
  if (/^[=+\-@]/.test(s)) s = "'" + s; // formül enjeksiyonunu önle
  return s.slice(0, uzunluk || 200);
}

function donem_(d) {
  var ay = Number(Utilities.formatDate(d, SAAT_DILIMI, 'M'));
  var yil = Number(Utilities.formatDate(d, SAAT_DILIMI, 'yyyy'));
  var bas = ay >= 8 ? yil : yil - 1;
  var no = (ay >= 2 && ay <= 7) ? '2. Dönem' : '1. Dönem';
  return bas + '-' + (bas + 1) + ' ' + no;
}

function zaman_(d) {
  return {
    tarih: Utilities.formatDate(d, SAAT_DILIMI, 'dd.MM.yyyy'),
    gun: GUNLER[Number(Utilities.formatDate(d, SAAT_DILIMI, 'u'))],
    saat: Utilities.formatDate(d, SAAT_DILIMI, 'HH:mm'),
    iso: d.toISOString()
  };
}

function kayit_(r) {
  return {
    id: String(r[C.id]), donem: String(r[C.donem]), sube: String(r[C.sube]), ogrenci: String(r[C.ogrenci]),
    ders: String(r[C.ders]), ogretmen: String(r[C.ogretmen]), yorum: String(r[C.not]).replace(/^'/, ''),
    tarih: String(r[C.tarih]), gun: String(r[C.gun]), saat: String(r[C.saat]),
    olusturma: String(r[C.iso]), duzenleme: String(r[C.duz] || '')
  };
}

function satirlar_() {
  var sh = sayfa_(), son = sh.getLastRow();
  if (son < 2) return [];
  return sh.getRange(2, 1, son - 1, BASLIK.length).getDisplayValues();
}

function bul_(id) {
  var s = satirlar_();
  for (var i = 0; i < s.length; i++) if (s[i][C.id] === String(id)) return { no: i + 2, veri: s[i] };
  return null;
}

/**
 * Öğretmen sınıf listesindeki tamamlanmış notları tek seferde gönderir.
 * Aynı dönemde aynı öğrenci + ders için not zaten varsa yenisi eklenmez (atlanan).
 */
function topluEkle_(v) {
  if (!v.sube || !v.ders || !v.ogretmen) return { ok: false, hata: 'Eksik seçim var.' };
  var sube = temizle_(v.sube), ders = temizle_(v.ders), ogretmen = temizle_(v.ogretmen);
  var d = new Date(), z = zaman_(d), donem = donem_(d);
  var mevcut = {};
  satirlar_().forEach(function (r) {
    if (r[C.sube] === sube && r[C.ders] === ders && r[C.donem] === donem) mevcut[r[C.ogrenci]] = 1;
  });
  var yeni = [], eklenen = [], atlanan = [];
  (v.notlar || []).slice(0, 80).forEach(function (n) {
    var ogr = temizle_(n && n.ogrenci), metin = temizle_(n && n.yorum, 6000);
    if (!ogr || !metin) return;
    if (mevcut[ogr]) { atlanan.push(ogr); return; }
    mevcut[ogr] = 1;
    yeni.push([Utilities.getUuid(), donem, sube, ogr, ders, ogretmen, metin, z.tarih, z.gun, z.saat, z.iso, '', '']);
    eklenen.push(ogr);
  });
  if (yeni.length) {
    var sh = sayfa_();
    sh.getRange(sh.getLastRow() + 1, 1, yeni.length, BASLIK.length).setNumberFormat('@').setValues(yeni);
  }
  return { ok: true, eklenen: eklenen, atlanan: atlanan };
}

/** Bu dönem için o şube + derste notu gönderilmiş öğrencilerin yalnızca adları (not metni dönmez). */
function durum_(v) {
  var donem = donem_(new Date()), sube = String(v.sube || ''), ders = String(v.ders || '');
  var adlar = satirlar_().filter(function (r) {
    return r[C.sube] === sube && r[C.ders] === ders && r[C.donem] === donem;
  }).map(function (r) { return r[C.ogrenci]; });
  return { ok: true, gonderilen: adlar };
}

/** Gönderilmiş notu yalnızca yönetici düzenler. */
function duzenle_(v) {
  if (!yoneticiMi_(v.sifre)) return { ok: false, hata: 'Gönderilen notu yalnızca yönetici değiştirebilir.' };
  var b = bul_(v.id);
  if (!b) return { ok: false, hata: 'Not bulunamadı (silinmiş olabilir).' };
  var metin = temizle_(v.yorum, 6000);
  if (!metin) return { ok: false, hata: 'Not boş olamaz.' };
  var z = zaman_(new Date()), duz = z.tarih + ' ' + z.gun + ' ' + z.saat;
  var sh = sayfa_();
  sh.getRange(b.no, C.not + 1).setNumberFormat('@').setValue(metin);
  sh.getRange(b.no, C.duz + 1).setNumberFormat('@').setValue(duz);
  b.veri[C.not] = metin; b.veri[C.duz] = duz;
  return { ok: true, kayit: kayit_(b.veri) };
}

/** Gönderilmiş notu yalnızca yönetici siler. */
function sil_(v) {
  if (!yoneticiMi_(v.sifre)) return { ok: false, hata: 'Gönderilen notu yalnızca yönetici silebilir.' };
  var b = bul_(v.id);
  if (!b) return { ok: true };
  sayfa_().deleteRow(b.no);
  return { ok: true };
}

function hepsi_(v) {
  if (!yoneticiMi_(v.sifre)) return { ok: false, hata: 'Yönetici şifresi hatalı.' };
  return { ok: true, kayitlar: satirlar_().map(kayit_) };
}

/** Yönetici: bir şubenin (boşsa tüm şubelerin) notlarını, istenirse yalnızca bir dönemde, siler. Şifre her seferinde istenir. */
function topluSil_(v) {
  if (!yoneticiMi_(v.sifre)) return { ok: false, hata: 'Yönetici şifresi hatalı.' };
  var sube = String(v.sube || ''), donem = String(v.donem || '');
  var sh = sayfa_(), son = sh.getLastRow();
  if (son < 2) return { ok: true, silinen: 0 };
  var aralik = sh.getRange(2, 1, son - 1, BASLIK.length);
  var veri = aralik.getDisplayValues();
  var kalan = veri.filter(function (r) {
    var eslesir = (!sube || r[C.sube] === sube) && (!donem || r[C.donem] === donem);
    return !eslesir;
  });
  var silinen = veri.length - kalan.length;
  if (!silinen) return { ok: true, silinen: 0 };
  aralik.clearContent();
  if (kalan.length) sh.getRange(2, 1, kalan.length, BASLIK.length).setNumberFormat('@').setValues(kalan);
  if (son - 1 > kalan.length) sh.deleteRows(kalan.length + 2, son - 1 - kalan.length);
  return { ok: true, silinen: silinen };
}
