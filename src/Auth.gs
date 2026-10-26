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

function authPostaGonder(eposta, ad, kod, amac) {
  if (MailApp.getRemainingDailyQuota() < 1) {
    return 'Bugünlük e-posta gönderim sınırına ulaşıldı. Yarın tekrar deneyin.';
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
  return { ok: true, token: token, kullanici: k, ad: ad };
}

function authKayitOl(ad, kullanici, eposta, sifre) {
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

  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  var u;
  try {
    var sp = authSp();
    if (sp.getProperty('kullanici:' + k)) return { ok: false, hata: 'Bu kullanıcı adı alınmış.' };
    if (authEpostaSahibi(e)) return { ok: false, hata: 'Bu e-posta adresiyle kayıtlı bir hesap var. Giriş yapın ya da şifrenizi yenileyin.' };
    var tuz = Utilities.getUuid() + Utilities.getUuid();
    u = { ad: ad, tuz: tuz, hash: authHashle(s, tuz), olusturma: Date.now(), eposta: e, dogrulandi: false };
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
  return { ok: true, kullanici: o.k, ad: u.ad, eposta: authEpostaMaskele(u.eposta) };
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
