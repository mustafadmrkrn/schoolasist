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

function kayitOl(ad, kullanici, sifre) {
  return authKayitOl(ad, kullanici, sifre);
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
  authOturumZorunlu(token);
  return olusturNobetCizelgesi(girdi);
}

function sinavAnaliz(token, girdi) {
  authOturumZorunlu(token);
  return sinavAnaliziYap(girdi);
}

function denemeAnaliz(token, girdi) {
  authOturumZorunlu(token);
  return denemeAnaliziYap(girdi);
}
