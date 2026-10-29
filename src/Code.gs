var SURUM = '29.10.2026.3';

/**
 * Web uygulaması giriş noktası.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('MD Education Asist')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * index.html içinde <?!= include('dosya-adi') ?> ile parça dosyalar eklenir.
 */
function include(ad) {
  return HtmlService.createHtmlOutputFromFile(ad).getContent();
}

/* ---------- Hesap işlemleri (giriş yapmadan çağrılabilir) ---------- */

/**
 * Giriş ekranı açılışta çağırır: sunucu kodunun sürümü ve e-posta gönderme izni.
 * İzin yoksa MailApp hata fırlatır; giriş ekranı uyarı gösterir.
 */
function sistemDurumu() {
  var r = { surum: SURUM, epostaIzni: false, kota: 0 };
  try {
    r.kota = MailApp.getRemainingDailyQuota();
    r.epostaIzni = true;
  } catch (e) {
    r.hata = String(e && e.message ? e.message : e);
  }
  return r;
}

function kayitOl(ad, kullanici, eposta, sifre, rolBilgi) {
  return authKayitOl(ad, kullanici, eposta, sifre, rolBilgi);
}

function epostaKoduGonder(bilet, eposta) {
  return authEpostaKoduGonder(bilet, eposta);
}

function epostaDogrula(bilet, kod) {
  return authEpostaDogrula(bilet, kod);
}

function sifreKoduIste(kimlik) {
  return authSifreKoduIste(kimlik);
}

function sifreSifirla(kimlik, kod, yeniSifre) {
  return authSifreSifirla(kimlik, kod, yeniSifre);
}

function girisYap(kullanici, sifre) {
  return authGirisYap(kullanici, sifre);
}

function oturumKontrol(token) {
  return authOturum(token);
}

function cikisYap(token) {
  authCikis(token);
  return { ok: true };
}

/* ---------- Araçlar (geçerli oturum gerekir) ---------- */

function cizelgeUret(token, girdi) {
  rolAracZorunlu(token, 'nobet');
  return olusturNobetCizelgesi(girdi);
}

function sinavAnaliz(token, girdi) {
  rolAracZorunlu(token, 'sinav');
  return sinavAnaliziYap(girdi);
}

function denemeAnaliz(token, girdi) {
  rolAracZorunlu(token, 'sinav');
  return denemeAnaliziYap(girdi);
}

/* ---------- Okul yönetimi ve admin (geçerli oturum ve yetki gerekir) ---------- */

function okulPaneli(token, okulId) { return rolOkulPaneli(token, okulId); }
function okulAraclariKaydet(token, okulId, araclar) { return rolOkulAraclariKaydet(token, okulId, araclar); }
function okulKoduYenile(token, okulId) { return rolOkulKoduYenile(token, okulId); }
function okuldanCikar(token, okulId, kullanici) { return rolOkuldanCikar(token, okulId, kullanici); }
function okulaKatil(token, kod) { return rolOkulaKatil(token, kod); }
function adminPaneli(token) { return rolAdminPaneli(token); }
function adminBasvuruOnayla(token, kullanici, okulId) { return rolAdminBasvuruOnayla(token, kullanici, okulId); }
function adminBasvuruReddet(token, kullanici) { return rolAdminBasvuruReddet(token, kullanici); }
function adminKullaniciGuncelle(token, kullanici, degisiklik) { return rolAdminKullaniciGuncelle(token, kullanici, degisiklik); }
function adminOkulOlustur(token, ad) { return rolAdminOkulOlustur(token, ad); }

/* ---------- Okul verileri ve öğrenci değerlendirme (Veri.gs) ---------- */
function veriOku(token, okulId) { return veriOkuIslem(token, okulId); }
function veriKaydet(token, okulId, tur, islem) { return veriKaydetIslem(token, okulId, tur, islem); }
function dgDurum(token, okulId, sinif, ders) { return veriDgDurum(token, okulId, sinif, ders); }
function dgGonder(token, okulId, paket) { return veriDgGonder(token, okulId, paket); }
function dgHepsi(token, okulId) { return veriDgHepsi(token, okulId); }
function dgDuzenle(token, okulId, id, metin) { return veriDgDuzenle(token, okulId, id, metin); }
function dgSil(token, okulId, idler) { return veriDgSil(token, okulId, idler); }

/* ---------- Kurulum yardımcısı ---------- */

/**
 * Apps Script düzenleyicisinde bir kez çalıştırın (üstteki işlev listesinden epostaTesti → Çalıştır).
 * Google, e-posta gönderme iznini ister; izin verildikten sonra kendi adresinize bir deneme
 * e-postası gelir ve günlük kalan kota günlüğe yazılır. Web uygulaması kendi başına bu izni
 * isteyemez; izin verilmeden doğrulama e-postaları gitmez.
 */
function epostaTesti() {
  var adres = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({
    to: adres,
    subject: AUTH_UYGULAMA + ' e-posta testi',
    body: 'E-posta gönderimi çalışıyor. Doğrulama kodları bu hesaptan gönderilecek.',
    name: AUTH_UYGULAMA
  });
  console.log('Deneme e-postası gönderildi: ' + adres + ' · Bugün kalan kota: ' + MailApp.getRemainingDailyQuota());
}

/**
 * Okul verileri E-Tabloda tutulur. Güncellemeden sonra düzenleyicide bir kez çalıştırın
 * (işlev listesinden eTabloIzni → Çalıştır): Google, E-Tablo oluşturma iznini ister.
 */
function eTabloIzni() {
  var ss = SpreadsheetApp.create('MD Education Asist - izin denemesi');
  var id = ss.getId();
  DriveApp.getFileById(id).setTrashed(true);
  console.log('E-Tablo izni tamam.');
}
