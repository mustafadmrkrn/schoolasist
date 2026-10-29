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
