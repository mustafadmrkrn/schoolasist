/**
 * MD Education Asist — Apps Script sunucu kodu (tek dosya).
 * Bu dosya scripts/kurulum.js ile üretilir; düzenlemeleri src/ altında yapın.
 */

/* ===================== Code.gs ===================== */
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
  // Çalıştırınca Google izin penceresi açılır; burada E-Tablo oluşturulmaz.
  console.log('E-Tablo izni tamam: ' + (typeof SpreadsheetApp.create === 'function'));
}


/* ===================== Auth.gs ===================== */
/**
 * Kullanıcı adı, şifre ve e-posta doğrulaması ile giriş (sunucu tarafı).
 *
 * Depolama: Script Properties.
 *   kullanici:<ad>   -> { ad, tuz, hash, olusturma, eposta, dogrulandi, kod, gonderim }
 *   eposta:<adres>   -> <kullanıcı adı>   (yalnızca DOĞRULANMIŞ adresler; bir adres tek hesaba ait olur)
 *   oturum:<özet>    -> { k, bitis }   (anahtar, oturum belirtecinin SHA-256 özetidir)
 * Önbellek (CacheService):
 *   bilet:<özet>     -> <kullanıcı adı>   (doğrulama ekranı için 30 dakikalık bilet)
 *
 * E-posta doğrulaması:
 * - Kayıtta e-posta zorunludur; hesap doğrulanana kadar oturum açılmaz.
 * - 6 haneli kod e-postayla gider (MailApp, uygulamayı dağıtan hesabın Gmail'inden).
 *   Kod 15 dakika geçerlidir, 5 yanlış denemede iptal olur, depoda yalnızca özeti tutulur.
 * - Yeniden gönderme 60 saniyede bir, kullanıcı başına günde en fazla 10 e-posta.
 * - E-postası olmayan eski hesaplar bir sonraki girişte e-posta ekleyip doğrular.
 * - Şifre sıfırlama aynı kod düzeniyle çalışır; yanıt, hesabın var olup olmadığını belli etmez.
 *
 * Güvenlik notları:
 * - Şifre düz metin saklanmaz. Her kullanıcının kendi tuzu vardır ve şifre,
 *   tuzla anahtarlanmış HMAC-SHA256'nın AUTH_TUR kez tekrarıyla özetlenir.
 *   Apps Script'te PBKDF2/bcrypt yok; tekrar sayısı bu yüzden sınırlıdır.
 *   Kullanıcı sayısı veya sahip olunan veri büyürse Firebase Auth, Supabase
 *   gibi bir kimlik hizmetine geçilmelidir.
 * - Oturum belirteci sunucuda yalnızca özet olarak saklanır.
 * - Aynı kullanıcı adına 5 hatalı denemeden sonra 5 dakika giriş engellenir.
 * - Script Properties toplam ~500 KB ile sınırlıdır; birkaç bin kullanıcıdan
 *   sonra depolamayı Sheets'e taşıyın.
 */
var AUTH_TUR = 1000;
var AUTH_OTURUM_MS = 7 * 24 * 60 * 60 * 1000;
var AUTH_HATA_ESIGI = 5;
var AUTH_KILIT_SN = 300;
var AUTH_KOD_MS = 15 * 60 * 1000;
var AUTH_KOD_DENEME = 5;
var AUTH_GONDERIM_ARA_MS = 60 * 1000;
var AUTH_GUNLUK_GONDERIM = 10;
var AUTH_BILET_SN = 1800;
var AUTH_UYGULAMA = 'MD Education Asist';

function authSp() {
  return PropertiesService.getScriptProperties();
}

function authKullaniciNormal(k) {
  return String(k || '').trim().toLowerCase();
}

function authKullaniciGecerli(k) {
  return /^[a-z0-9._-]{3,30}$/.test(k);
}

function authBayt(metin) {
  return Utilities.newBlob(String(metin)).getBytes();
}

function authHashle(sifre, tuz) {
  var anahtar = authBayt(tuz);
  var b = Utilities.computeHmacSha256Signature(authBayt(sifre), anahtar);
  for (var i = 1; i < AUTH_TUR; i++) {
    b = Utilities.computeHmacSha256Signature(b, anahtar);
  }
  return Utilities.base64Encode(b);
}

function authEsit(a, b) {
  if (a.length !== b.length) return false;
  var fark = 0;
  for (var i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

function authTokenAnahtar(token) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token))
  );
}

/* ---------- E-posta yardımcıları ---------- */

function authEpostaNormal(e) {
  return String(e || '').trim().toLowerCase();
}

function authEpostaGecerli(e) {
  return e.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

function authEpostaMaskele(e) {
  var p = String(e || '').split('@');
  if (p.length !== 2) return '';
  var ad = p[0];
  var g = ad.length <= 2 ? ad.charAt(0) + '*' : ad.slice(0, 2) + '***';
  return g + '@' + p[1];
}

function authKullaniciOku(k) {
  var ham = authSp().getProperty('kullanici:' + k);
  if (!ham) return null;
  try { return JSON.parse(ham); } catch (e) { return null; }
}

function authKullaniciYaz(k, u) {
  authSp().setProperty('kullanici:' + k, JSON.stringify(u));
}

/** Eski kayıtlarda dogrulandi alanı yoktur; yalnızca açıkça true olan hesap doğrulanmıştır. */
function authDogrulanmisMi(u) {
  return !!(u && u.dogrulandi === true && u.eposta);
}

/** Adres doğrulanmış başka bir hesaba ait mi? */
function authEpostaSahibi(e) {
  var k = authSp().getProperty('eposta:' + e);
  if (!k) return null;
  var u = authKullaniciOku(k);
  if (!authDogrulanmisMi(u) || u.eposta !== e) {
    authSp().deleteProperty('eposta:' + e);
    return null;
  }
  return k;
}

function authKodUret() {
  var hex = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var n = parseInt(hex.slice(0, 12), 16) % 1000000;
  return ('000000' + n).slice(-6);
}

function authKodOzet(k, amac, kod) {
  return authTokenAnahtar(k + ':' + amac + ':' + kod);
}

function authBugun() {
  return Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyy-MM-dd');
}

function authBiletVer(k) {
  var bilet = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('bilet:' + authTokenAnahtar(bilet), k, AUTH_BILET_SN);
  return bilet;
}

function authBiletKullanici(bilet) {
  if (typeof bilet !== 'string' || bilet.length < 32 || bilet.length > 100) return null;
  return CacheService.getScriptCache().get('bilet:' + authTokenAnahtar(bilet));
}

var AUTH_IZIN_HATASI = 'E-posta gönderme izni verilmemiş. Uygulama sahibi Apps Script düzenleyicisinde epostaTesti işlevini bir kez çalıştırıp izin vermeli.';

function authIzinHatasiMi(e) {
  return /permission|authoriz|izin|yetki|script\.send_mail/i.test(String(e && e.message ? e.message : e));
}

function authPostaGonder(eposta, ad, kod, amac) {
  try {
    if (MailApp.getRemainingDailyQuota() < 1) {
      return 'Bugünlük e-posta gönderim sınırına ulaşıldı. Yarın tekrar deneyin.';
    }
  } catch (e) {
    console.error('E-posta kotası okunamadı: ' + (e && e.message ? e.message : e));
    return authIzinHatasiMi(e) ? AUTH_IZIN_HATASI : 'E-posta gönderilemedi. Biraz sonra tekrar deneyin.';
  }
  var sifre = amac === 'sifre';
  var konu = AUTH_UYGULAMA + (sifre ? ' şifre yenileme kodu: ' : ' doğrulama kodu: ') + kod;
  var aciklama = sifre
    ? 'Şifrenizi yenilemek için aşağıdaki kodu kullanın.'
    : 'E-posta adresinizi doğrulamak için aşağıdaki kodu giriş ekranına yazın.';
  var duz = 'Merhaba ' + ad + ',\n\n' + aciklama + '\n\nKod: ' + kod +
    '\n\nKod 15 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n\n' + AUTH_UYGULAMA;
  var guvenliAd = String(ad).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
  var html = '<div style="font-family:Arial,sans-serif;color:#10264A;max-width:28rem">' +
    '<p>Merhaba ' + guvenliAd + ',</p><p>' + aciklama + '</p>' +
    '<p style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#EAF1FB;padding:12px 16px;border-radius:8px;display:inline-block">' + kod + '</p>' +
    '<p style="color:#566B8C;font-size:13px">Kod 15 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>' +
    '<p style="color:#566B8C;font-size:13px">' + AUTH_UYGULAMA + '</p></div>';
  try {
    MailApp.sendEmail({ to: eposta, subject: konu, body: duz, htmlBody: html, name: AUTH_UYGULAMA });
  } catch (e) {
    console.error('E-posta gönderilemedi: ' + (e && e.message ? e.message : e));
    if (authIzinHatasiMi(e)) return AUTH_IZIN_HATASI;
    return 'E-posta gönderilemedi. Adresi kontrol edip tekrar deneyin.';
  }
  return '';
}

/**
 * Kullanıcıya yeni kod üretip gönderir; kayıt nesnesini günceller (çağıran kaydeder).
 * Dönüş: '' başarı, aksi halde hata metni.
 */
function authKodGonder(k, u, amac) {
  var simdi = Date.now();
  var g = u.gonderim || {};
  // Bekleme aynı tür kod için uygulanır (doğrulamadan hemen sonra şifre kodu istenebilsin).
  if (g.son && g.amac === amac && simdi - g.son < AUTH_GONDERIM_ARA_MS) {
    var kalan = Math.ceil((AUTH_GONDERIM_ARA_MS - (simdi - g.son)) / 1000);
    return 'Yeni kod için ' + kalan + ' saniye bekleyin.';
  }
  var gun = authBugun();
  var sayi = g.gun === gun ? g.sayi || 0 : 0;
  if (sayi >= AUTH_GUNLUK_GONDERIM) return 'Bugün çok fazla kod istendi. Yarın tekrar deneyin.';
  var kod = authKodUret();
  var hata = authPostaGonder(u.eposta, u.ad, kod, amac);
  if (hata) return hata;
  u.kod = { amac: amac, ozet: authKodOzet(k, amac, kod), bitis: simdi + AUTH_KOD_MS, deneme: 0 };
  u.gonderim = { son: simdi, amac: amac, gun: gun, sayi: sayi + 1 };
  return '';
}

/** Kodu denetler; yanlışsa deneme sayısını artırır. Dönüş: '' doğru, aksi halde hata metni. */
function authKodDenetle(k, u, amac, kod) {
  var c = u.kod;
  if (!c || c.amac !== amac || c.bitis < Date.now()) return 'Kodun süresi dolmuş. Yeni kod isteyin.';
  if (c.deneme >= AUTH_KOD_DENEME) return 'Çok fazla yanlış deneme. Yeni kod isteyin.';
  var temiz = String(kod || '').replace(/\D/g, '');
  if (temiz.length !== 6 || !authEsit(authKodOzet(k, amac, temiz), c.ozet)) {
    c.deneme++;
    return c.deneme >= AUTH_KOD_DENEME ? 'Çok fazla yanlış deneme. Yeni kod isteyin.' : 'Kod hatalı.';
  }
  delete u.kod;
  return '';
}

function authDogrulamaYaniti(k, u, ekler) {
  var r = { ok: false, dogrulama: true, bilet: authBiletVer(k), eposta: u.eposta ? authEpostaMaskele(u.eposta) : '', epostaGerekli: !u.eposta };
  Object.keys(ekler || {}).forEach(function (a) { r[a] = ekler[a]; });
  return r;
}

function authSuresiDolanlariTemizle() {
  var sp = authSp();
  var simdi = Date.now();
  sp.getKeys().forEach(function (anahtar) {
    if (anahtar.indexOf('oturum:') !== 0) return;
    try {
      var o = JSON.parse(sp.getProperty(anahtar));
      if (!o || o.bitis < simdi) sp.deleteProperty(anahtar);
    } catch (e) {
      sp.deleteProperty(anahtar);
    }
  });
}

function authOturumAc(k, ad) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  authSp().setProperty(
    'oturum:' + authTokenAnahtar(token),
    JSON.stringify({ k: k, bitis: Date.now() + AUTH_OTURUM_MS })
  );
  if (Math.random() < 0.1) authSuresiDolanlariTemizle();
  return authRolEkle({ ok: true, token: token, kullanici: k, ad: ad }, k);
}

/** Roller.gs yüklüyse yanıta rol, okul ve araç bilgisini ekler. */
function authRolEkle(r, k, u) {
  if (typeof rolKullaniciBilgisi !== 'function') return r;
  var b = rolKullaniciBilgisi(k, u || authKullaniciOku(k));
  Object.keys(b).forEach(function (a) { r[a] = b[a]; });
  return r;
}

function authKayitOl(ad, kullanici, eposta, sifre, rolBilgi) {
  ad = String(ad || '').trim();
  var k = authKullaniciNormal(kullanici);
  var e = authEpostaNormal(eposta);
  var s = String(sifre || '');

  if (!ad || ad.length > 60) return { ok: false, hata: 'Ad soyad 1 ile 60 karakter arasında olmalı.' };
  if (!authKullaniciGecerli(k)) {
    return { ok: false, hata: 'Kullanıcı adı 3-30 karakter olmalı; yalnızca a-z, rakam, nokta, tire ve alt çizgi kullanılabilir.' };
  }
  if (s.length < 8 || s.length > 100) return { ok: false, hata: 'Şifre en az 8 karakter olmalı.' };
  if (s.toLowerCase() === k) return { ok: false, hata: 'Şifre kullanıcı adıyla aynı olamaz.' };
  if (!authEpostaGecerli(e)) return { ok: false, hata: 'Geçerli bir e-posta adresi yazın.' };
  var rolAlanlari = typeof rolKayitHazirla === 'function' ? rolKayitHazirla(rolBilgi) : {};
  if (rolAlanlari.hata) return { ok: false, hata: rolAlanlari.hata };

  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  var u;
  try {
    var sp = authSp();
    if (sp.getProperty('kullanici:' + k)) return { ok: false, hata: 'Bu kullanıcı adı alınmış.' };
    if (authEpostaSahibi(e)) return { ok: false, hata: 'Bu e-posta adresiyle kayıtlı bir hesap var. Giriş yapın ya da şifrenizi yenileyin.' };
    var tuz = Utilities.getUuid() + Utilities.getUuid();
    u = { ad: ad, tuz: tuz, hash: authHashle(s, tuz), olusturma: Date.now(), eposta: e, dogrulandi: false };
    Object.keys(rolAlanlari).forEach(function (a) { u[a] = rolAlanlari[a]; });
    var hata = authKodGonder(k, u, 'dogrulama');
    if (hata) return { ok: false, hata: hata };
    authKullaniciYaz(k, u);
  } finally {
    kilit.releaseLock();
  }
  return authDogrulamaYaniti(k, u, { gonderildi: true });
}

function authGirisYap(kullanici, sifre) {
  var genel = { ok: false, hata: 'Kullanıcı adı veya şifre hatalı.' };
  var k = authKullaniciNormal(kullanici);
  if (!authKullaniciGecerli(k)) return genel;

  var onbellek = CacheService.getScriptCache();
  var kilitAnahtar = 'hata:' + k;
  var sayi = parseInt(onbellek.get(kilitAnahtar) || '0', 10);
  if (sayi >= AUTH_HATA_ESIGI) {
    return { ok: false, hata: 'Çok fazla hatalı deneme. 5 dakika sonra tekrar deneyin.' };
  }

  var ham = authSp().getProperty('kullanici:' + k);
  var u = ham ? JSON.parse(ham) : null;
  // Kullanıcı yokken de aynı işi yap ki yanıt süresi kullanıcı varlığını belli etmesin.
  var hash = authHashle(String(sifre || ''), u ? u.tuz : 'kayit-yok-tuzu');
  if (!u || !authEsit(hash, u.hash)) {
    onbellek.put(kilitAnahtar, String(sayi + 1), AUTH_KILIT_SN);
    return genel;
  }
  onbellek.remove(kilitAnahtar);
  if (authDogrulanmisMi(u)) return authOturumAc(k, u.ad);

  // Şifre doğru ama e-posta doğrulanmamış: doğrulama ekranına yönlendir.
  var ekler = { gonderildi: false };
  if (u.eposta && !(u.kod && u.kod.amac === 'dogrulama' && u.kod.bitis > Date.now())) {
    var hata = authKodGonder(k, u, 'dogrulama');
    authKullaniciYaz(k, u);
    if (hata) ekler.uyari = hata; else ekler.gonderildi = true;
  }
  return authDogrulamaYaniti(k, u, ekler);
}

/**
 * Doğrulama ekranından: kodu yeniden gönder. eposta verilirse (eski hesaplar ya da
 * yanlış yazılmış adres) önce adres güncellenir. Doğrulanmış hesapta adres değiştirilemez.
 */
function authEpostaKoduGonder(bilet, eposta) {
  var k = authBiletKullanici(bilet);
  if (!k) return { ok: false, hata: 'Doğrulama süresi doldu. Yeniden giriş yapın.', yenidenGiris: true };
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var u = authKullaniciOku(k);
    if (!u) return { ok: false, hata: 'Hesap bulunamadı.', yenidenGiris: true };
    if (authDogrulanmisMi(u)) return { ok: false, hata: 'E-posta zaten doğrulanmış. Giriş yapın.', yenidenGiris: true };
    if (eposta !== undefined && eposta !== null && eposta !== '') {
      var e = authEpostaNormal(eposta);
      if (!authEpostaGecerli(e)) return { ok: false, hata: 'Geçerli bir e-posta adresi yazın.' };
      var sahip = authEpostaSahibi(e);
      if (sahip && sahip !== k) return { ok: false, hata: 'Bu e-posta adresi başka bir hesapta doğrulanmış.' };
      if (u.eposta !== e) { u.eposta = e; delete u.kod; }
    }
    if (!u.eposta) return { ok: false, hata: 'Önce e-posta adresinizi yazın.' };
    var mevcutSahip = authEpostaSahibi(u.eposta);
    if (mevcutSahip && mevcutSahip !== k) return { ok: false, hata: 'Bu e-posta adresi başka bir hesapta doğrulanmış. Başka bir adres yazın.' };
    var hata = authKodGonder(k, u, 'dogrulama');
    authKullaniciYaz(k, u);
    if (hata) return { ok: false, hata: hata };
    return { ok: true, eposta: authEpostaMaskele(u.eposta) };
  } finally {
    kilit.releaseLock();
  }
}

/** Doğrulama kodunu denetler; doğruysa hesabı doğrular ve oturum açar. */
function authEpostaDogrula(bilet, kod) {
  var k = authBiletKullanici(bilet);
  if (!k) return { ok: false, hata: 'Doğrulama süresi doldu. Yeniden giriş yapın.', yenidenGiris: true };
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var u = authKullaniciOku(k);
    if (!u || !u.eposta) return { ok: false, hata: 'Önce e-posta adresinizi yazın.' };
    var sahip = authEpostaSahibi(u.eposta);
    if (sahip && sahip !== k) return { ok: false, hata: 'Bu e-posta adresi başka bir hesapta doğrulanmış. Başka bir adres yazın.' };
    var hata = authKodDenetle(k, u, 'dogrulama', kod);
    if (hata) { authKullaniciYaz(k, u); return { ok: false, hata: hata }; }
    u.dogrulandi = true;
    u.dogrulama = Date.now();
    authKullaniciYaz(k, u);
    authSp().setProperty('eposta:' + u.eposta, k);
    CacheService.getScriptCache().remove('bilet:' + authTokenAnahtar(bilet));
  } finally {
    kilit.releaseLock();
  }
  return authOturumAc(k, u.ad);
}

/** Kullanıcı adı ya da doğrulanmış e-posta ile hesabı bulur. */
function authKimlikBul(kimlik) {
  var x = String(kimlik || '').trim().toLowerCase();
  if (x.indexOf('@') > -1) return authEpostaSahibi(x);
  return authKullaniciGecerli(x) && authKullaniciOku(x) ? x : null;
}

var AUTH_SIFRE_GENEL = 'Bilgiler bir hesapla eşleşiyorsa kayıtlı e-posta adresine kod gönderildi. Gelen kutusunu ve gereksiz klasörünü kontrol edin.';

/** Şifre yenileme kodu ister. Yanıt, hesabın var olup olmadığını belli etmez. */
function authSifreKoduIste(kimlik) {
  var k = authKimlikBul(kimlik);
  if (!k) return { ok: true, mesaj: AUTH_SIFRE_GENEL };
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var u = authKullaniciOku(k);
    if (!u || !u.eposta) return { ok: true, mesaj: AUTH_SIFRE_GENEL };
    // Bekleme ya da günlük sınır nedeniyle gönderilemese de yanıt aynıdır (hesap varlığı belli olmasın).
    authKodGonder(k, u, 'sifre');
    authKullaniciYaz(k, u);
  } finally {
    kilit.releaseLock();
  }
  return { ok: true, mesaj: AUTH_SIFRE_GENEL };
}

/** Kodla şifreyi yeniler; tüm eski oturumları kapatır ve yeni oturum açar. */
function authSifreSifirla(kimlik, kod, yeniSifre) {
  var genel = { ok: false, hata: 'Kod hatalı ya da süresi dolmuş.' };
  var k = authKimlikBul(kimlik);
  var s = String(yeniSifre || '');
  if (s.length < 8 || s.length > 100) return { ok: false, hata: 'Şifre en az 8 karakter olmalı.' };
  if (!k) return genel;
  if (s.toLowerCase() === k) return { ok: false, hata: 'Şifre kullanıcı adıyla aynı olamaz.' };
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  var u;
  try {
    u = authKullaniciOku(k);
    if (!u || !u.eposta) return genel;
    var hata = authKodDenetle(k, u, 'sifre', kod);
    if (hata) { authKullaniciYaz(k, u); return { ok: false, hata: hata === 'Kod hatalı.' ? genel.hata : hata }; }
    u.tuz = Utilities.getUuid() + Utilities.getUuid();
    u.hash = authHashle(s, u.tuz);
    // Kod e-postaya gittiğine göre adres de doğrulanmış olur.
    if (!authDogrulanmisMi(u)) {
      var sahip = authEpostaSahibi(u.eposta);
      if (!sahip || sahip === k) {
        u.dogrulandi = true;
        u.dogrulama = Date.now();
        authSp().setProperty('eposta:' + u.eposta, k);
      }
    }
    authKullaniciYaz(k, u);
    authOturumlariKapat(k);
    CacheService.getScriptCache().remove('hata:' + k);
  } finally {
    kilit.releaseLock();
  }
  if (!authDogrulanmisMi(u)) return authDogrulamaYaniti(k, u, { gonderildi: false });
  return authOturumAc(k, u.ad);
}

function authOturumlariKapat(k) {
  var sp = authSp();
  sp.getKeys().forEach(function (anahtar) {
    if (anahtar.indexOf('oturum:') !== 0) return;
    try {
      var o = JSON.parse(sp.getProperty(anahtar));
      if (!o || o.k === k) sp.deleteProperty(anahtar);
    } catch (e) {
      sp.deleteProperty(anahtar);
    }
  });
}

function authOturum(token) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 100) return { ok: false };
  var sp = authSp();
  var anahtar = 'oturum:' + authTokenAnahtar(token);
  var ham = sp.getProperty(anahtar);
  if (!ham) return { ok: false };
  var o;
  try {
    o = JSON.parse(ham);
  } catch (e) {
    sp.deleteProperty(anahtar);
    return { ok: false };
  }
  if (!o || o.bitis < Date.now()) {
    sp.deleteProperty(anahtar);
    return { ok: false };
  }
  var u = authKullaniciOku(o.k);
  // E-postası doğrulanmamış (ör. eski) hesapların oturumu geçersizdir; yeniden girişte doğrulanır.
  if (!authDogrulanmisMi(u)) return { ok: false };
  return authRolEkle({ ok: true, kullanici: o.k, ad: u.ad, eposta: authEpostaMaskele(u.eposta) }, o.k, u);
}

function authCikis(token) {
  if (typeof token === 'string' && token) {
    authSp().deleteProperty('oturum:' + authTokenAnahtar(token));
  }
}

/** Korumalı sunucu işlevlerinin başında çağrılır. Geçersizse hata fırlatır. */
function authOturumZorunlu(token) {
  var o = authOturum(token);
  if (!o.ok) throw new Error('Oturum geçersiz veya süresi dolmuş. Lütfen yeniden giriş yapın.');
  return o;
}


/* ===================== Roller.gs ===================== */
/**
 * Kullanıcı rolleri, okullar ve araç izinleri (sunucu tarafı).
 *
 * Roller:
 *   admin     Her şeyi görür; yönetici başvurularını onaylar, rolleri ve okulları yönetir.
 *   yonetici  Kendi okulunu yönetir: okul kodu, üyeler, öğretmen ve öğrencilerin göreceği araçlar.
 *   ogretmen  Okulunun açtığı araçları görür; okulu yoksa tüm öğretmen araçlarını görür.
 *   ogrenci   Okulunun öğrencilere açtığı araçları görür (başlangıçta hiçbiri).
 *
 * Depolama (Script Properties):
 *   kullanici:<k>   -> { ..., rol, okul, basvuru: { okulAdi, tarih } }
 *   okul:<id>       -> { ad, kod, olusturma, araclar: { ogretmen: [...], ogrenci: [...] } }
 *   okulkod:<KOD>   -> <id>
 *   adminler        -> ["k1", ...]   (ROL_ADMINLER sabitine ek olarak)
 *
 * Kayıtta "okul yöneticisi" seçen kullanıcı, admin onaylayana kadar öğretmen yetkisiyle girer;
 * onaylanınca başvurudaki adla yeni okul açılır ve kullanıcı o okulun yöneticisi olur.
 *
 * Not: Araçların hesaplamaları tarayıcıda yapılır; araç izinleri menüde ne görüneceğini ve
 * sunucu çağrılarını belirler, kullanıcının kendi dosyasını işlemesini engellemek için değildir.
 */
var ROL_ADMINLER = ['mustafadmrkrn'];
var ROL_ADLARI = { admin: 'Admin', yonetici: 'Okul yöneticisi', ogretmen: 'Öğretmen', ogrenci: 'Öğrenci' };
var ROL_ARACLAR = [
  { id: 'nobet', ad: 'Nöbet çizelgesi' },
  { id: 'sinav', ad: 'Sınav analizi' },
  { id: 'mentor', ad: 'Mentörlük' },
  { id: 'yillik', ad: 'Yıllık plan' },
  { id: 'degerlendirme', ad: 'Öğrenci değerlendirme' }
];
var ROL_KOD_HARF = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function rolAracIdleri() { return ROL_ARACLAR.map(function (a) { return a.id; }); }

function rolAracListesi(liste) {
  var gecerli = rolAracIdleri();
  return (Array.isArray(liste) ? liste : []).filter(function (x, i, d) { return gecerli.indexOf(x) > -1 && d.indexOf(x) === i; });
}

function rolOku(anahtar) {
  var ham = authSp().getProperty(anahtar);
  if (!ham) return null;
  try { return JSON.parse(ham); } catch (e) { return null; }
}

function rolAdminlerOku() {
  var x = rolOku('adminler');
  return ROL_ADMINLER.concat(Array.isArray(x) ? x : []);
}

function rolAdminMi(k) { return rolAdminlerOku().indexOf(k) > -1; }

function rolOkulOku(id) { return id ? rolOku('okul:' + id) : null; }

function rolOkulYaz(id, o) { authSp().setProperty('okul:' + id, JSON.stringify(o)); }

/** Kullanıcının geçerli rolü: admin listesi önceliklidir; bilinmeyen/eski kayıtlar öğretmen sayılır. */
function rolEtkin(k, u) {
  if (rolAdminMi(k)) return 'admin';
  var r = u && u.rol;
  if (r === 'yonetici' && !(u.okul && rolOkulOku(u.okul))) return 'ogretmen';
  return r === 'yonetici' || r === 'ogrenci' || r === 'ogretmen' ? r : 'ogretmen';
}

/** Kullanıcının menüde göreceği araçlar ve paneller. */
function rolKullaniciBilgisi(k, u) {
  var rol = rolEtkin(k, u);
  var okul = u && u.okul ? rolOkulOku(u.okul) : null;
  var araclar;
  if (rol === 'admin' || rol === 'yonetici') araclar = rolAracIdleri();
  else if (rol === 'ogretmen') araclar = okul ? rolAracListesi(okul.araclar && okul.araclar.ogretmen) : rolAracIdleri();
  else araclar = okul ? rolAracListesi(okul.araclar && okul.araclar.ogrenci) : [];
  var paneller = [];
  if (rol === 'admin' || rol === 'yonetici' || (rol === 'ogretmen' && !okul)) paneller.push('veri');
  if (rol === 'yonetici' || (rol === 'admin' && okul)) paneller.push('okul');
  if (rol === 'admin') paneller.push('admin');
  return {
    rol: rol,
    rolAdi: ROL_ADLARI[rol],
    okul: okul ? { id: u.okul, ad: okul.ad } : null,
    araclar: araclar,
    paneller: paneller,
    basvuru: u && u.basvuru ? { okulAdi: u.basvuru.okulAdi } : null
  };
}

/* ---------- Okul kodu ---------- */

function rolKodUret() {
  for (var deneme = 0; deneme < 20; deneme++) {
    var hex = Utilities.getUuid().replace(/-/g, '');
    var kod = '';
    for (var i = 0; i < 6; i++) kod += ROL_KOD_HARF.charAt(parseInt(hex.substr(i * 2, 2), 16) % ROL_KOD_HARF.length);
    if (!authSp().getProperty('okulkod:' + kod)) return kod;
  }
  throw new Error('Okul kodu üretilemedi, tekrar deneyin.');
}

function rolKodNormal(kod) { return String(kod || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function rolOkulKoddan(kod) {
  var k = rolKodNormal(kod);
  if (k.length !== 6) return null;
  var id = authSp().getProperty('okulkod:' + k);
  return id && rolOkulOku(id) ? id : null;
}

function rolOkulOlustur(ad) {
  var id = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  var kod = rolKodUret();
  var o = { ad: ad, kod: kod, olusturma: Date.now(), araclar: { ogretmen: rolAracIdleri(), ogrenci: [] } };
  rolOkulYaz(id, o);
  authSp().setProperty('okulkod:' + kod, id);
  return id;
}

function rolOkulAdiGecerli(ad) {
  ad = String(ad || '').trim().replace(/\s+/g, ' ');
  return ad.length >= 3 && ad.length <= 80 ? ad : '';
}

/* ---------- Kayıt sırasında rol ---------- */

/**
 * Kayıt formundaki rol bilgisini doğrular. Dönüş: { hata } ya da kullanıcı kaydına eklenecek alanlar.
 * rolBilgi: { rol: 'ogretmen' | 'ogrenci' | 'yonetici', okulKodu, okulAdi }
 */
function rolKayitHazirla(rolBilgi) {
  var b = rolBilgi || {};
  var rol = b.rol === 'ogrenci' || b.rol === 'yonetici' ? b.rol : 'ogretmen';
  var kodVar = rolKodNormal(b.okulKodu).length > 0;
  if (rol === 'yonetici') {
    var ad = rolOkulAdiGecerli(b.okulAdi);
    if (!ad) return { hata: 'Okulun adını yazın (en az 3 karakter).' };
    return { rol: 'ogretmen', basvuru: { okulAdi: ad, tarih: Date.now() } };
  }
  if (rol === 'ogrenci' && !kodVar) return { hata: 'Öğrenci kaydı için okul kodu gerekli. Kodu öğretmeninizden ya da okul yönetiminden alın.' };
  if (kodVar) {
    var id = rolOkulKoddan(b.okulKodu);
    if (!id) return { hata: 'Okul kodu bulunamadı. Kodu kontrol edin.' };
    return { rol: rol, okul: id };
  }
  return { rol: rol };
}

/* ---------- Yetki denetimi ---------- */

function rolOturum(token) {
  var o = authOturumZorunlu(token);
  var u = authKullaniciOku(o.kullanici);
  if (!u) throw new Error('Oturum geçersiz veya süresi dolmuş. Lütfen yeniden giriş yapın.');
  return { k: o.kullanici, u: u, bilgi: rolKullaniciBilgisi(o.kullanici, u) };
}

/** Araç sunucu çağrılarının başında: kullanıcının bu araca izni yoksa hata. */
function rolAracZorunlu(token, arac) {
  var s = rolOturum(token);
  if (s.bilgi.araclar.indexOf(arac) < 0) throw new Error('Bu araç hesabınıza açık değil.');
  return s;
}

function rolAdminZorunlu(token) {
  var s = rolOturum(token);
  if (s.bilgi.rol !== 'admin') throw new Error('Bu işlem için admin yetkisi gerekli.');
  return s;
}

/** Okul üzerinde yönetim yetkisi: kendi okulunun yöneticisi ya da admin. */
function rolOkulYetkisi(token, okulId) {
  var s = rolOturum(token);
  var id = okulId || (s.u && s.u.okul);
  if (!id || !rolOkulOku(id)) throw new Error('Okul bulunamadı.');
  if (s.bilgi.rol === 'admin') return { s: s, id: id };
  if (s.bilgi.rol === 'yonetici' && s.u.okul === id) return { s: s, id: id };
  throw new Error('Bu okulu yönetme yetkiniz yok.');
}

/* ---------- Kullanıcı listesi ---------- */

function rolTumKullanicilar() {
  var sp = authSp();
  var liste = [];
  sp.getKeys().forEach(function (anahtar) {
    if (anahtar.indexOf('kullanici:') !== 0) return;
    var k = anahtar.slice(10);
    var u = rolOku(anahtar);
    if (u) liste.push({ k: k, u: u });
  });
  return liste;
}

function rolUyeOzeti(x, epostaTam) {
  return {
    kullanici: x.k,
    ad: x.u.ad,
    eposta: epostaTam ? (x.u.eposta || '') : authEpostaMaskele(x.u.eposta || ''),
    rol: rolEtkin(x.k, x.u),
    dogrulandi: authDogrulanmisMi(x.u),
    olusturma: x.u.olusturma || 0
  };
}

/* ---------- Okul yöneticisi işlemleri ---------- */

function rolOkulPaneli(token, okulId) {
  var y = rolOkulYetkisi(token, okulId);
  var o = rolOkulOku(y.id);
  var uyeler = rolTumKullanicilar().filter(function (x) { return x.u.okul === y.id; })
    .map(function (x) { return rolUyeOzeti(x, false); })
    .sort(function (a, b) { return String(a.ad).localeCompare(String(b.ad), 'tr'); });
  return {
    ok: true,
    okul: { id: y.id, ad: o.ad, kod: o.kod, araclar: { ogretmen: rolAracListesi(o.araclar && o.araclar.ogretmen), ogrenci: rolAracListesi(o.araclar && o.araclar.ogrenci) } },
    araclar: ROL_ARACLAR,
    uyeler: uyeler
  };
}

function rolOkulAraclariKaydet(token, okulId, araclar) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var y = rolOkulYetkisi(token, okulId);
    var o = rolOkulOku(y.id);
    o.araclar = { ogretmen: rolAracListesi(araclar && araclar.ogretmen), ogrenci: rolAracListesi(araclar && araclar.ogrenci) };
    rolOkulYaz(y.id, o);
    return { ok: true, araclar: o.araclar };
  } finally {
    kilit.releaseLock();
  }
}

function rolOkulKoduYenile(token, okulId) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var y = rolOkulYetkisi(token, okulId);
    var o = rolOkulOku(y.id);
    authSp().deleteProperty('okulkod:' + o.kod);
    o.kod = rolKodUret();
    authSp().setProperty('okulkod:' + o.kod, y.id);
    rolOkulYaz(y.id, o);
    return { ok: true, kod: o.kod };
  } finally {
    kilit.releaseLock();
  }
}

/** Yönetici, okulundaki öğretmen ya da öğrenciyi okuldan çıkarır (hesap silinmez). */
function rolOkuldanCikar(token, okulId, kullanici) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var y = rolOkulYetkisi(token, okulId);
    var k = authKullaniciNormal(kullanici);
    var u = authKullaniciOku(k);
    if (!u || u.okul !== y.id) return { ok: false, hata: 'Kullanıcı bu okulda değil.' };
    if (k === y.s.k) return { ok: false, hata: 'Kendinizi okuldan çıkaramazsınız.' };
    var rol = rolEtkin(k, u);
    if ((rol === 'yonetici' || rol === 'admin') && y.s.bilgi.rol !== 'admin') return { ok: false, hata: 'Yöneticileri yalnızca admin çıkarabilir.' };
    delete u.okul;
    if (u.rol === 'yonetici') u.rol = 'ogretmen';
    authKullaniciYaz(k, u);
    return { ok: true };
  } finally {
    kilit.releaseLock();
  }
}

/** Okulu olmayan öğretmen ya da öğrenci okul koduyla okula katılır. */
function rolOkulaKatil(token, kod) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var s = rolOturum(token);
    if (s.u.okul && rolOkulOku(s.u.okul)) return { ok: false, hata: 'Zaten bir okula kayıtlısınız.' };
    var id = rolOkulKoddan(kod);
    if (!id) return { ok: false, hata: 'Okul kodu bulunamadı. Kodu kontrol edin.' };
    s.u.okul = id;
    authKullaniciYaz(s.k, s.u);
    return { ok: true, bilgi: rolKullaniciBilgisi(s.k, s.u) };
  } finally {
    kilit.releaseLock();
  }
}

/* ---------- Admin işlemleri ---------- */

function rolAdminPaneli(token) {
  rolAdminZorunlu(token);
  var tum = rolTumKullanicilar();
  var okullar = [];
  authSp().getKeys().forEach(function (a) {
    if (a.indexOf('okul:') !== 0) return;
    var o = rolOku(a);
    if (!o) return;
    var id = a.slice(5);
    var uyeler = tum.filter(function (x) { return x.u.okul === id; });
    okullar.push({
      id: id, ad: o.ad, kod: o.kod, olusturma: o.olusturma || 0,
      uyeSayisi: uyeler.length,
      yoneticiler: uyeler.filter(function (x) { return rolEtkin(x.k, x.u) === 'yonetici'; }).map(function (x) { return x.u.ad; })
    });
  });
  okullar.sort(function (a, b) { return String(a.ad).localeCompare(String(b.ad), 'tr'); });
  var kullanicilar = tum.map(function (x) {
    var r = rolUyeOzeti(x, true);
    r.okul = x.u.okul && rolOkulOku(x.u.okul) ? x.u.okul : '';
    r.basvuru = x.u.basvuru ? { okulAdi: x.u.basvuru.okulAdi, tarih: x.u.basvuru.tarih } : null;
    r.sabitAdmin = ROL_ADMINLER.indexOf(x.k) > -1;
    return r;
  }).sort(function (a, b) { return (b.olusturma || 0) - (a.olusturma || 0); });
  return { ok: true, kullanicilar: kullanicilar, okullar: okullar, roller: ROL_ADLARI };
}

function rolAdminBasvuruOnayla(token, kullanici, okulId) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    rolAdminZorunlu(token);
    var k = authKullaniciNormal(kullanici);
    var u = authKullaniciOku(k);
    if (!u || !u.basvuru) return { ok: false, hata: 'Bekleyen başvuru bulunamadı.' };
    // Var olan bir okula yönetici olarak atanabilir ya da başvurudaki adla yeni okul açılır.
    var id = okulId && rolOkulOku(okulId) ? okulId : rolOkulOlustur(u.basvuru.okulAdi);
    u.rol = 'yonetici';
    u.okul = id;
    delete u.basvuru;
    authKullaniciYaz(k, u);
    return { ok: true, okul: id };
  } finally {
    kilit.releaseLock();
  }
}

function rolAdminBasvuruReddet(token, kullanici) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    rolAdminZorunlu(token);
    var k = authKullaniciNormal(kullanici);
    var u = authKullaniciOku(k);
    if (!u || !u.basvuru) return { ok: false, hata: 'Bekleyen başvuru bulunamadı.' };
    delete u.basvuru;
    authKullaniciYaz(k, u);
    return { ok: true };
  } finally {
    kilit.releaseLock();
  }
}

/** Admin bir kullanıcının rolünü ve okulunu değiştirir. okul: '' okulsuz. */
function rolAdminKullaniciGuncelle(token, kullanici, degisiklik) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var s = rolAdminZorunlu(token);
    var k = authKullaniciNormal(kullanici);
    var u = authKullaniciOku(k);
    if (!u) return { ok: false, hata: 'Kullanıcı bulunamadı.' };
    var d = degisiklik || {};
    var rol = ROL_ADLARI[d.rol] ? d.rol : rolEtkin(k, u);
    if (ROL_ADMINLER.indexOf(k) > -1 && rol !== 'admin') return { ok: false, hata: 'Bu hesap kod içinde admin olarak tanımlı; rolü buradan değiştirilemez.' };
    if (k === s.k && rol !== 'admin') return { ok: false, hata: 'Kendi admin yetkinizi kaldıramazsınız.' };
    var okul = d.okul === undefined ? (u.okul || '') : String(d.okul || '');
    if (okul && !rolOkulOku(okul)) return { ok: false, hata: 'Okul bulunamadı.' };
    if (rol === 'yonetici' && !okul) return { ok: false, hata: 'Okul yöneticisi için bir okul seçin.' };
    var adminler = rolOku('adminler');
    adminler = Array.isArray(adminler) ? adminler : [];
    var i = adminler.indexOf(k);
    if (rol === 'admin' && i < 0 && ROL_ADMINLER.indexOf(k) < 0) adminler.push(k);
    if (rol !== 'admin' && i > -1) adminler.splice(i, 1);
    authSp().setProperty('adminler', JSON.stringify(adminler));
    u.rol = rol === 'admin' ? (u.rol || 'ogretmen') : rol;
    if (okul) u.okul = okul; else delete u.okul;
    if (rol === 'yonetici') delete u.basvuru;
    authKullaniciYaz(k, u);
    return { ok: true };
  } finally {
    kilit.releaseLock();
  }
}

function rolAdminOkulOlustur(token, ad) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    rolAdminZorunlu(token);
    var temiz = rolOkulAdiGecerli(ad);
    if (!temiz) return { ok: false, hata: 'Okulun adını yazın (en az 3 karakter).' };
    var id = rolOkulOlustur(temiz);
    return { ok: true, okul: id, kod: rolOkulOku(id).kod };
  } finally {
    kilit.releaseLock();
  }
}


/* ===================== Veri.gs ===================== */
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


/* ===================== Nobet.gs ===================== */
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


/* ===================== Sinav.gs ===================== */
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


/* ===================== Deneme.gs ===================== */
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
