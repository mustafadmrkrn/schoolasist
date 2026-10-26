/**
 * Kullanıcı adı ve şifre ile giriş (sunucu tarafı).
 *
 * Depolama: Script Properties.
 *   kullanici:<ad>   -> { ad, tuz, hash, olusturma }
 *   oturum:<özet>    -> { k, bitis }   (anahtar, oturum belirtecinin SHA-256 özetidir)
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

function authKayitOl(ad, kullanici, sifre) {
  ad = String(ad || '').trim();
  var k = authKullaniciNormal(kullanici);
  var s = String(sifre || '');

  if (!ad || ad.length > 60) return { ok: false, hata: 'Ad soyad 1 ile 60 karakter arasında olmalı.' };
  if (!authKullaniciGecerli(k)) {
    return { ok: false, hata: 'Kullanıcı adı 3-30 karakter olmalı; yalnızca a-z, rakam, nokta, tire ve alt çizgi kullanılabilir.' };
  }
  if (s.length < 8 || s.length > 100) return { ok: false, hata: 'Şifre en az 8 karakter olmalı.' };
  if (s.toLowerCase() === k) return { ok: false, hata: 'Şifre kullanıcı adıyla aynı olamaz.' };

  var kilit = LockService.getScriptLock();
  kilit.waitLock(10000);
  try {
    var sp = authSp();
    if (sp.getProperty('kullanici:' + k)) return { ok: false, hata: 'Bu kullanıcı adı alınmış.' };
    var tuz = Utilities.getUuid() + Utilities.getUuid();
    sp.setProperty(
      'kullanici:' + k,
      JSON.stringify({ ad: ad, tuz: tuz, hash: authHashle(s, tuz), olusturma: Date.now() })
    );
  } finally {
    kilit.releaseLock();
  }
  return authOturumAc(k, ad);
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
  return authOturumAc(k, u.ad);
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
  var kr = sp.getProperty('kullanici:' + o.k);
  if (!kr) return { ok: false };
  return { ok: true, kullanici: o.k, ad: JSON.parse(kr).ad };
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
