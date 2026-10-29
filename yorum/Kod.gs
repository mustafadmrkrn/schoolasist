/**
 * Anaokulu Öğrenci Yorumları — Google Apps Script sunucusu.
 *
 * Kurulum (bir kez):
 *  1. Yeni bir Google E-Tablo açın (ör. "Anaokulu Yorumları").
 *  2. Uzantılar > Apps Script. Açılan Kod.gs içeriğini silip bu dosyanın tamamını yapıştırın.
 *  3. Aşağıdaki YONETICI_SIFRE değerini değiştirin, kaydedin.
 *  4. Dağıt > Yeni dağıtım > Tür: Web uygulaması
 *       Şu kullanıcı olarak çalıştır: Ben
 *       Erişimi olan kullanıcılar: Herkes
 *     Dağıt'a basın, izinleri onaylayın, "Web uygulaması URL'sini" kopyalayın.
 *  5. Bu URL'yi docs/yorum/ayar.js içindeki API_URL alanına yazın.
 *
 * Kodu değiştirirseniz: Dağıt > Dağıtımları yönet > Düzenle > Sürüm: Yeni sürüm.
 * (Böylece URL değişmez.)
 */

var YONETICI_SIFRE = '1234';   // <-- MUTLAKA DEĞİŞTİRİN
var SAYFA_ADI = 'Yorumlar';
var SAAT_DILIMI = 'Europe/Istanbul';
var GUNLER = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
var BASLIK = ['ID', 'Şube', 'Öğrenci', 'Ders', 'Öğretmen', 'Yorum',
              'Tarih', 'Gün', 'Saat', 'Oluşturma (ISO)', 'Son Düzenleme', 'Anahtar'];

function doGet(e) {
  var islem = e && e.parameter && e.parameter.islem;
  if (islem) return cevap_(isle_(e.parameter));
  return cevap_({ ok: true, mesaj: 'Anaokulu yorum sunucusu çalışıyor.' });
}

function doPost(e) {
  var veri = {};
  try { veri = JSON.parse(e.postData.contents || '{}'); }
  catch (hata) { return cevap_({ ok: false, hata: 'Geçersiz istek.' }); }
  return cevap_(isle_(veri));
}

function cevap_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne))
    .setMimeType(ContentService.MimeType.JSON);
}

function isle_(v) {
  try {
    switch (v.islem) {
      case 'ekle': return kilitli_(function () { return ekle_(v); });
      case 'duzenle': return kilitli_(function () { return duzenle_(v); });
      case 'sil': return kilitli_(function () { return sil_(v); });
      case 'liste': return liste_(v);
      case 'hepsi': return hepsi_(v);
      case 'yonetici': return { ok: yoneticiMi_(v.sifre) };
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
    sh.setColumnWidth(6, 420);
    sh.hideColumns(12); // Anahtar sütunu gizli
  }
  return sh;
}

function yoneticiMi_(sifre) {
  return String(sifre || '') === String(YONETICI_SIFRE);
}

function temizle_(s, uzunluk) {
  s = String(s == null ? '' : s).trim();
  // Formül enjeksiyonunu önle
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s.slice(0, uzunluk || 200);
}

function zamanBilgisi_(d) {
  return {
    tarih: Utilities.formatDate(d, SAAT_DILIMI, 'dd.MM.yyyy'),
    gun: GUNLER[Number(Utilities.formatDate(d, SAAT_DILIMI, 'u'))],
    saat: Utilities.formatDate(d, SAAT_DILIMI, 'HH:mm'),
    iso: d.toISOString()
  };
}

function satirdanKayit_(r) {
  return {
    id: String(r[0]), sube: r[1], ogrenci: r[2], ders: r[3], ogretmen: r[4],
    yorum: String(r[5]).replace(/^'/, ''), tarih: r[6] instanceof Date ? Utilities.formatDate(r[6], SAAT_DILIMI, 'dd.MM.yyyy') : String(r[6]),
    gun: r[7], saat: r[8] instanceof Date ? Utilities.formatDate(r[8], SAAT_DILIMI, 'HH:mm') : String(r[8]),
    olusturma: String(r[9]), duzenleme: String(r[10] || '')
  };
}

function tumSatirlar_() {
  var sh = sayfa_();
  var son = sh.getLastRow();
  if (son < 2) return [];
  return sh.getRange(2, 1, son - 1, BASLIK.length).getValues();
}

function satirBul_(id) {
  var satirlar = tumSatirlar_();
  for (var i = 0; i < satirlar.length; i++) {
    if (String(satirlar[i][0]) === String(id)) return { no: i + 2, veri: satirlar[i] };
  }
  return null;
}

function ekle_(v) {
  var yorum = temizle_(v.yorum, 5000);
  if (!yorum) return { ok: false, hata: 'Yorum boş olamaz.' };
  if (!v.sube || !v.ogrenci || !v.ders || !v.ogretmen) return { ok: false, hata: 'Eksik seçim var.' };
  var z = zamanBilgisi_(new Date());
  var id = Utilities.getUuid();
  var anahtar = Utilities.getUuid();
  var satir = [id, temizle_(v.sube), temizle_(v.ogrenci), temizle_(v.ders), temizle_(v.ogretmen),
               yorum, z.tarih, z.gun, z.saat, z.iso, '', anahtar];
  var sh = sayfa_();
  sh.getRange(sh.getLastRow() + 1, 1, 1, satir.length).setNumberFormat('@').setValues([satir]);
  return { ok: true, anahtar: anahtar, kayit: satirdanKayit_(satir) };
}

function yetkili_(bulunan, v) {
  return yoneticiMi_(v.sifre) || (v.anahtar && String(bulunan.veri[11]) === String(v.anahtar));
}

function duzenle_(v) {
  var b = satirBul_(v.id);
  if (!b) return { ok: false, hata: 'Yorum bulunamadı (silinmiş olabilir).' };
  if (!yetkili_(b, v)) return { ok: false, hata: 'Bu yorumu yalnızca yazıldığı cihazdan veya yönetici düzenleyebilir.' };
  var yorum = temizle_(v.yorum, 5000);
  if (!yorum) return { ok: false, hata: 'Yorum boş olamaz.' };
  var z = zamanBilgisi_(new Date());
  var duz = z.tarih + ' ' + z.gun + ' ' + z.saat;
  var sh = sayfa_();
  sh.getRange(b.no, 6).setValue(yorum);
  sh.getRange(b.no, 11).setNumberFormat('@').setValue(duz);
  b.veri[5] = yorum; b.veri[10] = duz;
  return { ok: true, kayit: satirdanKayit_(b.veri) };
}

function sil_(v) {
  var b = satirBul_(v.id);
  if (!b) return { ok: true }; // zaten yok
  if (!yetkili_(b, v)) return { ok: false, hata: 'Bu yorumu yalnızca yazıldığı cihazdan veya yönetici silebilir.' };
  sayfa_().deleteRow(b.no);
  return { ok: true };
}

function liste_(v) {
  var sonuc = tumSatirlar_().filter(function (r) {
    return r[1] === v.sube && r[2] === v.ogrenci && (!v.ogretmen || r[4] === v.ogretmen);
  }).map(satirdanKayit_);
  return { ok: true, kayitlar: sonuc };
}

function hepsi_(v) {
  if (!yoneticiMi_(v.sifre)) return { ok: false, hata: 'Yönetici şifresi hatalı.' };
  return { ok: true, kayitlar: tumSatirlar_().map(satirdanKayit_) };
}
