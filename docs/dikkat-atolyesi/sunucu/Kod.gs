/**
 * Dikkat Atölyesi – hesap sunucusu (Google Apps Script)
 *
 * Aile hesapları (kullanıcı adı + şifre), çocuk profilleri, ilerleme ve kullanım süresi.
 * Veriler, ilk çalıştırmada Drive'ınızda otomatik açılan "Dikkat Atölyesi Veritabanı" E-Tablosunda tutulur.
 *
 * Kurulum: README'deki "Hesap sunucusu kurulumu" adımlarına bakın.
 */

var SURUM = '2026-11-01';
var OTURUM_GUN = 180;          // giriş kaç gün hatırlansın
var HASH_TUR = 1000;           // şifre özeti tekrar sayısı
var MAKS_HATALI = 8;           // 15 dakikada en fazla hatalı giriş
var MAKS_COCUK = 8;
var MAKS_VERI = 45000;         // bir ailenin verisi (karakter)

/* ================= Giriş noktaları ================= */
function doGet() {
  return cikti_({ ok: true, ad: 'Dikkat Atölyesi sunucusu', surum: SURUM, mesaj: 'Sunucu çalışıyor.' });
}

function doPost(e) {
  var istek;
  try { istek = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return cikti_({ ok: false, hata: 'gecersiz_istek' }); }
  return cikti_(isle_(istek));
}

function isle_(istek) {
  try {
    switch (istek.action) {
      case 'ping': return { ok: true, surum: SURUM };
      case 'register': return kayit_(istek.u, istek.p);
      case 'login': return giris_(istek.u, istek.p);
      case 'load': return yukle_(istek.token);
      case 'saveChild': return cocukKaydet_(istek.token, istek.child);
      case 'deleteChild': return cocukSil_(istek.token, istek.id);
      case 'changePassword': return sifreDegistir_(istek.token, istek.old, istek.p);
      case 'logout': return cikis_(istek.token);
      default: return { ok: false, hata: 'bilinmeyen_islem' };
    }
  } catch (err) {
    console.error(err);
    return { ok: false, hata: 'sunucu_hatasi', detay: String(err && err.message || err) };
  }
}

function cikti_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(ContentService.MimeType.JSON);
}

/* ================= E-Tablo ================= */
var BASLIK_AILE = ['kullanici', 'tuz', 'ozet', 'olusturma', 'son_giris', 'veri', 'guncelleme'];
var BASLIK_OTURUM = ['token_ozeti', 'kullanici', 'bitis'];

function tablo_() {
  var ozellik = PropertiesService.getScriptProperties();
  var id = ozellik.getProperty('VERITABANI_ID');
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Dikkat Atölyesi Veritabanı');
    ozellik.setProperty('VERITABANI_ID', ss.getId());
  }
  return ss;
}
function sayfa_(ad, baslik) {
  var ss = tablo_();
  var sh = ss.getSheetByName(ad);
  if (!sh) {
    sh = ss.insertSheet(ad);
    sh.appendRow(baslik);
  }
  return sh;
}
function aileSayfasi_() { return sayfa_('Aileler', BASLIK_AILE); }
function oturumSayfasi_() { return sayfa_('Oturumlar', BASLIK_OTURUM); }

function aileBul_(kullanici) {
  var sh = aileSayfasi_();
  var v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]) === kullanici) return { sh: sh, satir: i + 1, d: v[i] };
  }
  return null;
}

/* ================= Yardımcılar ================= */
function ozet_(metin) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, metin, Utilities.Charset.UTF_8));
}
function sifreOzeti_(tuz, sifre) {
  var h = tuz + '|' + sifre;
  for (var i = 0; i < HASH_TUR; i++) h = ozet_(h + '|' + tuz);
  return h;
}
function rastgele_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function simdi_() { return new Date().getTime(); }

function kullaniciDogrula_(u) {
  u = String(u || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,24}$/.test(u)) return null;
  return u;
}
function kilitle_(fn) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(15000);
  try { return fn(); } finally { kilit.releaseLock(); }
}
function bosVeri_() { return { children: [] }; }
function veriOku_(aile) {
  try { var v = JSON.parse(aile.d[5] || '{}'); if (!v.children) v.children = []; return v; }
  catch (e) { return bosVeri_(); }
}
function veriYaz_(aile, veri) {
  var metin = JSON.stringify(veri);
  if (metin.length > MAKS_VERI) throw new Error('Veri çok büyük');
  aile.sh.getRange(aile.satir, 6, 1, 2).setValues([[metin, new Date()]]);
  aile.d[5] = metin;
}

/* ================= Oturum ================= */
function oturumAc_(kullanici) {
  var token = rastgele_();
  oturumSayfasi_().appendRow([ozet_(token), kullanici, simdi_() + OTURUM_GUN * 864e5]);
  return token;
}
function oturumKullanici_(token) {
  if (!token || String(token).length < 20) return null;
  var oz = ozet_(String(token));
  var onbellek = CacheService.getScriptCache();
  var hizli = onbellek.get('t:' + oz);
  if (hizli) return hizli;
  var v = oturumSayfasi_().getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) {
    if (v[i][0] === oz) {
      if (Number(v[i][2]) < simdi_()) return null;
      onbellek.put('t:' + oz, String(v[i][1]), 21600);
      return String(v[i][1]);
    }
  }
  return null;
}

/* ================= İşlemler ================= */
function kayit_(u, p) {
  var kullanici = kullaniciDogrula_(u);
  if (!kullanici) return { ok: false, hata: 'kullanici_gecersiz' };
  if (!p || String(p).length < 6 || String(p).length > 100) return { ok: false, hata: 'sifre_kisa' };
  return kilitle_(function () {
    if (aileBul_(kullanici)) return { ok: false, hata: 'kullanici_var' };
    var tuz = rastgele_();
    var veri = bosVeri_();
    aileSayfasi_().appendRow([kullanici, tuz, sifreOzeti_(tuz, String(p)), new Date(), new Date(), JSON.stringify(veri), new Date()]);
    return { ok: true, token: oturumAc_(kullanici), user: kullanici, data: veri };
  });
}

function giris_(u, p) {
  var kullanici = kullaniciDogrula_(u);
  if (!kullanici) return { ok: false, hata: 'hatali_giris' };
  var onbellek = CacheService.getScriptCache();
  var anahtar = 'f:' + kullanici;
  var hatali = Number(onbellek.get(anahtar) || 0);
  if (hatali >= MAKS_HATALI) return { ok: false, hata: 'cok_deneme' };
  var aile = aileBul_(kullanici);
  if (!aile || sifreOzeti_(String(aile.d[1]), String(p || '')) !== String(aile.d[2])) {
    onbellek.put(anahtar, String(hatali + 1), 900);
    return { ok: false, hata: 'hatali_giris' };
  }
  onbellek.remove(anahtar);
  aile.sh.getRange(aile.satir, 5).setValue(new Date());
  return { ok: true, token: oturumAc_(kullanici), user: kullanici, data: veriOku_(aile) };
}

function yukle_(token) {
  var kullanici = oturumKullanici_(token);
  if (!kullanici) return { ok: false, hata: 'oturum_yok' };
  var aile = aileBul_(kullanici);
  if (!aile) return { ok: false, hata: 'oturum_yok' };
  return { ok: true, user: kullanici, data: veriOku_(aile) };
}

/* İki cihazdan gelen çocuk verisini birleştirir: her gün için en yeni deneme, her tarih için en uzun süre. */
function cocukBirlestir_(eski, yeni) {
  if (!eski) return yeni;
  var s = {};
  var k;
  for (k in eski) s[k] = eski[k];
  for (k in yeni) if (k !== 'days' && k !== 'usage' && k !== 'bonus') s[k] = yeni[k];
  s.days = {};
  var ed = eski.days || {}, yd = yeni.days || {};
  for (k in ed) s.days[k] = ed[k];
  for (k in yd) {
    if (!s.days[k] || Number(yd[k].ts || 0) >= Number(s.days[k].ts || 0)) {
      var best = Math.max(Number(yd[k].best || 0), Number((s.days[k] || {}).best || 0));
      s.days[k] = yd[k];
      s.days[k].best = best;
    }
  }
  ['usage', 'bonus'].forEach(function (alan) {
    s[alan] = {};
    var a = eski[alan] || {}, b = yeni[alan] || {};
    for (var t in a) s[alan][t] = Number(a[t]) || 0;
    for (t in b) s[alan][t] = Math.max(s[alan][t] || 0, Number(b[t]) || 0);
  });
  return s;
}

function cocukKaydet_(token, cocuk) {
  var kullanici = oturumKullanici_(token);
  if (!kullanici) return { ok: false, hata: 'oturum_yok' };
  if (!cocuk || !cocuk.id || !/^[a-z0-9]{4,20}$/i.test(String(cocuk.id))) return { ok: false, hata: 'gecersiz_cocuk' };
  cocuk.name = String(cocuk.name || '').slice(0, 30);
  return kilitle_(function () {
    var aile = aileBul_(kullanici);
    var veri = veriOku_(aile);
    var i = -1;
    for (var j = 0; j < veri.children.length; j++) if (veri.children[j].id === cocuk.id) i = j;
    if (i < 0) {
      if (veri.children.length >= MAKS_COCUK) return { ok: false, hata: 'cok_cocuk' };
      veri.children.push(cocuk);
      i = veri.children.length - 1;
    } else {
      veri.children[i] = cocukBirlestir_(veri.children[i], cocuk);
    }
    veriYaz_(aile, veri);
    return { ok: true, child: veri.children[i] };
  });
}

function cocukSil_(token, id) {
  var kullanici = oturumKullanici_(token);
  if (!kullanici) return { ok: false, hata: 'oturum_yok' };
  return kilitle_(function () {
    var aile = aileBul_(kullanici);
    var veri = veriOku_(aile);
    veri.children = veri.children.filter(function (c) { return c.id !== id; });
    veriYaz_(aile, veri);
    return { ok: true, data: veri };
  });
}

function sifreDegistir_(token, eskiSifre, yeniSifre) {
  var kullanici = oturumKullanici_(token);
  if (!kullanici) return { ok: false, hata: 'oturum_yok' };
  if (!yeniSifre || String(yeniSifre).length < 6) return { ok: false, hata: 'sifre_kisa' };
  return kilitle_(function () {
    var aile = aileBul_(kullanici);
    if (sifreOzeti_(String(aile.d[1]), String(eskiSifre || '')) !== String(aile.d[2])) return { ok: false, hata: 'hatali_giris' };
    var tuz = rastgele_();
    aile.sh.getRange(aile.satir, 2, 1, 2).setValues([[tuz, sifreOzeti_(tuz, String(yeniSifre))]]);
    return { ok: true };
  });
}

function cikis_(token) {
  if (!token) return { ok: true };
  var oz = ozet_(String(token));
  CacheService.getScriptCache().remove('t:' + oz);
  var sh = oturumSayfasi_();
  var v = sh.getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) if (v[i][0] === oz) { sh.deleteRow(i + 1); break; }
  return { ok: true };
}

/* ================= Yönetici araçları (editörden çalıştırın) ================= */

/** İlk kurulumda bir kez çalıştırın: veritabanı E-Tablosunu açar ve izinleri ister. */
function kurulum() {
  var ss = tablo_();
  aileSayfasi_(); oturumSayfasi_();
  var ilk = ss.getSheetByName('Sayfa1') || ss.getSheetByName('Sheet1');
  if (ilk && ss.getSheets().length > 2) ss.deleteSheet(ilk);
  console.log('Veritabanı hazır: ' + ss.getUrl());
}

/** Şifresini unutan bir aile için: aşağıdaki iki değeri değiştirip çalıştırın. */
function sifreSifirla() {
  var KULLANICI = 'kullanici_adi';
  var YENI_SIFRE = 'yeni-sifre-123';
  var aile = aileBul_(KULLANICI);
  if (!aile) { console.log('Böyle bir kullanıcı yok: ' + KULLANICI); return; }
  var tuz = rastgele_();
  aile.sh.getRange(aile.satir, 2, 1, 2).setValues([[tuz, sifreOzeti_(tuz, YENI_SIFRE)]]);
  console.log('Şifre değişti: ' + KULLANICI);
}
