// Çalıştırma: node tests/auth.test.js
// Apps Script servisleri (Utilities, PropertiesService, CacheService, LockService, MailApp)
// bu dosyada taklit edilir; amaç Auth.gs mantığını doğrulamaktır.
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var crypto = require('crypto');
var assert = require('assert');

function imzali(buf) {
  return Array.prototype.map.call(buf, function (b) { return b > 127 ? b - 256 : b; });
}
function imzasiz(dizi) {
  return Buffer.from(dizi.map(function (b) { return b & 255; }));
}

var depo = {};
var onbellek = {};
var postalar = [];
var kota = 100;
var postaHatasi = false;

var ctx = {
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' },
    newBlob: function (s) { return { getBytes: function () { return imzali(Buffer.from(String(s), 'utf8')); } }; },
    computeHmacSha256Signature: function (deger, anahtar) {
      return imzali(crypto.createHmac('sha256', imzasiz(anahtar)).update(imzasiz(deger)).digest());
    },
    computeDigest: function (alg, deger) { return imzali(crypto.createHash(alg).update(String(deger)).digest()); },
    base64Encode: function (b) { return imzasiz(b).toString('base64'); },
    base64EncodeWebSafe: function (b) { return imzasiz(b).toString('base64url'); },
    getUuid: function () { return crypto.randomUUID(); }
  },
  PropertiesService: {
    getScriptProperties: function () {
      return {
        getProperty: function (k) { return Object.prototype.hasOwnProperty.call(depo, k) ? depo[k] : null; },
        setProperty: function (k, v) { depo[k] = String(v); },
        deleteProperty: function (k) { delete depo[k]; },
        getKeys: function () { return Object.keys(depo); }
      };
    }
  },
  CacheService: {
    getScriptCache: function () {
      return {
        get: function (k) { return Object.prototype.hasOwnProperty.call(onbellek, k) ? onbellek[k] : null; },
        put: function (k, v) { onbellek[k] = String(v); },
        remove: function (k) { delete onbellek[k]; }
      };
    }
  },
  LockService: {
    getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; }
  },
  MailApp: {
    getRemainingDailyQuota: function () { return kota; },
    sendEmail: function (o) { if (postaHatasi) throw new Error('Invalid email'); postalar.push(o); kota--; }
  }
};
ctx.Utilities.formatDate = function (d) { return d.toISOString().slice(0, 10); };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'Auth.gs'), 'utf8'), ctx);

function sonKod(adres) {
  for (var i = postalar.length - 1; i >= 0; i--) {
    if (!adres || postalar[i].to === adres) return /Kod: (\d{6})/.exec(postalar[i].body)[1];
  }
  return null;
}
// Gönderim aralığı beklemesini testte atlamak için
function beklemeyiAtla(k) {
  var u = JSON.parse(depo['kullanici:' + k]);
  if (u.gonderim) u.gonderim.son = 0;
  depo['kullanici:' + k] = JSON.stringify(u);
}
function kayitVeDogrula(ad, k, e, s) {
  var r = ctx.authKayitOl(ad, k, e, s);
  assert.strictEqual(r.dogrulama, true, 'kayıt doğrulama ister: ' + JSON.stringify(r));
  return ctx.authEpostaDogrula(r.bilet, sonKod(e.toLowerCase()));
}

// 1) Kayıt: oturum açılmaz, kod gider; kodla doğrulanınca oturum açılır
var ilk = ctx.authKayitOl('Ayşe Demir', 'Ayse.Demir', 'Ayse@Okul.k12.tr', 'guclu-sifre-1');
assert.strictEqual(ilk.ok, false);
assert.strictEqual(ilk.dogrulama, true);
assert.strictEqual(ilk.token, undefined, 'doğrulanmadan oturum yok');
assert.strictEqual(ilk.eposta, 'ay***@okul.k12.tr', 'adres maskeli döner');
assert.strictEqual(postalar.length, 1);
assert.strictEqual(postalar[0].to, 'ayse@okul.k12.tr');
assert.ok(/doğrulama kodu/.test(postalar[0].subject));
var kod1 = sonKod();
assert.ok(/^\d{6}$/.test(kod1));
assert.ok(JSON.stringify(depo).indexOf(kod1) === -1 || JSON.stringify(depo).indexOf('"' + kod1 + '"') === -1, 'kod düz metin saklanmaz');
assert.strictEqual(ctx.authGirisYap('ayse.demir', 'guclu-sifre-1').dogrulama, true, 'doğrulanmadan giriş yok');
var yanlisKod = ctx.authEpostaDogrula(ilk.bilet, kod1 === '000000' ? '111111' : '000000');
assert.strictEqual(yanlisKod.ok, false);
assert.ok(/hatalı/.test(yanlisKod.hata));
var kayit = ctx.authEpostaDogrula(ilk.bilet, kod1);
assert.strictEqual(kayit.ok, true, JSON.stringify(kayit));
assert.strictEqual(kayit.kullanici, 'ayse.demir', 'kullanıcı adı küçük harfe çevrilir');
assert.strictEqual(kayit.ad, 'Ayşe Demir');
assert.strictEqual(depo['eposta:ayse@okul.k12.tr'], 'ayse.demir');
assert.strictEqual(ctx.authEpostaDogrula(ilk.bilet, kod1).ok, false, 'bilet ve kod tek kullanımlık');
var oturum = ctx.authOturum(kayit.token);
assert.strictEqual(oturum.ok, true);
assert.strictEqual(oturum.kullanici, 'ayse.demir');
assert.strictEqual(oturum.ad, 'Ayşe Demir');

// 2) Şifre ve belirteç düz metin saklanmaz
var tumDepo = JSON.stringify(depo);
assert.ok(tumDepo.indexOf('guclu-sifre-1') === -1, 'şifre depoda görünüyor');
assert.ok(tumDepo.indexOf(kayit.token) === -1, 'oturum belirteci depoda görünüyor');

// 3) Aynı kullanıcı adı (harf büyüklüğü farklı olsa da) ya da doğrulanmış e-posta reddedilir
var yinelenen = ctx.authKayitOl('Başka', 'AYSE.DEMIR', 'baska@ornek.com', 'baska-sifre-1');
assert.strictEqual(yinelenen.ok, false);
assert.ok(/alınmış/.test(yinelenen.hata));
var ayniPosta = ctx.authKayitOl('Başka', 'baska', 'AYSE@okul.k12.tr', 'baska-sifre-1');
assert.strictEqual(ayniPosta.ok, false);
assert.ok(/e-posta adresiyle kayıtlı/.test(ayniPosta.hata));

// 4) Geçersiz girdiler reddedilir
assert.strictEqual(ctx.authKayitOl('', 'ali', 'ali@ornek.com', 'sifre1234').ok, false, 'boş ad');
assert.strictEqual(ctx.authKayitOl('Ali', 'a', 'ali@ornek.com', 'sifre1234').ok, false, 'kısa kullanıcı adı');
assert.strictEqual(ctx.authKayitOl('Ali', 'ali veli', 'ali@ornek.com', 'sifre1234').ok, false, 'boşluklu kullanıcı adı');
assert.strictEqual(ctx.authKayitOl('Ali', 'ali.yilmaz', 'ali@ornek.com', '1234567').ok, false, '7 karakterlik şifre');
assert.strictEqual(ctx.authKayitOl('Ali', 'aliyilmaz', 'ali@ornek.com', 'aliyilmaz').ok, false, 'şifre = kullanıcı adı');
assert.ok(/e-posta/.test(ctx.authKayitOl('Ali', 'aliyilmaz', 'ali@ornek', 'sifre1234').hata), 'geçersiz e-posta');
assert.ok(/e-posta/.test(ctx.authKayitOl('Ali', 'aliyilmaz', '', 'sifre1234').hata), 'e-posta zorunlu');
assert.strictEqual(depo['kullanici:aliyilmaz'], undefined, 'hatalı kayıt depoya yazılmaz');

// 5) Doğru şifreyle giriş, yanlışıyla ret; kullanıcı yok / şifre yanlış mesajı aynı
var giris = ctx.authGirisYap('AYSE.demir', 'guclu-sifre-1');
assert.strictEqual(giris.ok, true);
assert.strictEqual(ctx.authOturum(giris.token).ok, true);
assert.notStrictEqual(giris.token, kayit.token, 'her girişte yeni belirteç');
var yanlis = ctx.authGirisYap('ayse.demir', 'yanlis-sifre');
var yok = ctx.authGirisYap('yok.kullanici', 'guclu-sifre-1');
assert.strictEqual(yanlis.ok, false);
assert.strictEqual(yanlis.hata, yok.hata);

// 6) Beş hatalı denemeden sonra doğru şifre de kilitlenir; başka kullanıcı etkilenmez
kayitVeDogrula('Mehmet Kaya', 'mehmet', 'mehmet@ornek.com', 'mehmet-sifre-1');
for (var i = 0; i < 5; i++) ctx.authGirisYap('mehmet', 'yanlis-' + i);
var kilitli = ctx.authGirisYap('mehmet', 'mehmet-sifre-1');
assert.strictEqual(kilitli.ok, false);
assert.ok(/Çok fazla/.test(kilitli.hata));
assert.strictEqual(ctx.authGirisYap('ayse.demir', 'guclu-sifre-1').ok, true);

// 7) Başarılı giriş hatalı deneme sayacını sıfırlar
kayitVeDogrula('Zeynep Çelik', 'zeynep', 'zeynep@ornek.com', 'zeynep-sifre-1');
for (var j = 0; j < 4; j++) ctx.authGirisYap('zeynep', 'yanlis-' + j);
assert.strictEqual(ctx.authGirisYap('zeynep', 'zeynep-sifre-1').ok, true);
for (var m = 0; m < 4; m++) ctx.authGirisYap('zeynep', 'yanlis-' + m);
assert.strictEqual(ctx.authGirisYap('zeynep', 'zeynep-sifre-1').ok, true, 'sayaç sıfırlanmadı');

// 8) Çıkış oturumu geçersiz kılar, korumalı işlev hata fırlatır
var cikisToken = ctx.authGirisYap('ayse.demir', 'guclu-sifre-1').token;
assert.strictEqual(ctx.authOturumZorunlu(cikisToken).ok, true);
ctx.authCikis(cikisToken);
assert.strictEqual(ctx.authOturum(cikisToken).ok, false);
assert.throws(function () { ctx.authOturumZorunlu(cikisToken); }, /Oturum geçersiz/);
assert.throws(function () { ctx.authOturumZorunlu(''); }, /Oturum geçersiz/);
assert.throws(function () { ctx.authOturumZorunlu(null); }, /Oturum geçersiz/);

// 9) Süresi dolan oturum geçersizdir ve silinir
var eskiToken = ctx.authGirisYap('ayse.demir', 'guclu-sifre-1').token;
Object.keys(depo).forEach(function (k) {
  if (k.indexOf('oturum:') === 0) {
    var o = JSON.parse(depo[k]);
    o.bitis = Date.now() - 1000;
    depo[k] = JSON.stringify(o);
  }
});
assert.strictEqual(ctx.authOturum(eskiToken).ok, false);
assert.strictEqual(ctx.authOturum(kayit.token).ok, false);

// 10) Temizlik süresi dolan oturumları siler
var oncekiSayi = Object.keys(depo).filter(function (k) { return k.indexOf('oturum:') === 0; }).length;
ctx.authSuresiDolanlariTemizle();
var sonrakiSayi = Object.keys(depo).filter(function (k) { return k.indexOf('oturum:') === 0; }).length;
assert.ok(sonrakiSayi < oncekiSayi || oncekiSayi === 0);

// 11) Rastgele belirteç tahmini işe yaramaz
assert.strictEqual(ctx.authOturum('a'.repeat(64)).ok, false);

// 12) Kod yeniden gönderme: bekleme, günlük sınır, adres düzeltme
(function () {
  var r = ctx.authKayitOl('Can Koç', 'can', 'can@yanlis.com', 'can-sifre-12');
  var tekrar = ctx.authEpostaKoduGonder(r.bilet);
  assert.strictEqual(tekrar.ok, false);
  assert.ok(/saniye bekleyin/.test(tekrar.hata), 'hemen tekrar gönderilmez');
  beklemeyiAtla('can');
  var duzelt = ctx.authEpostaKoduGonder(r.bilet, 'Can@Dogru.com');
  assert.strictEqual(duzelt.ok, true, JSON.stringify(duzelt));
  assert.strictEqual(postalar[postalar.length - 1].to, 'can@dogru.com');
  var eskiKod = sonKod('can@yanlis.com');
  var yeniKod = sonKod('can@dogru.com');
  if (eskiKod !== yeniKod) assert.strictEqual(ctx.authEpostaDogrula(r.bilet, eskiKod).ok, false, 'eski adrese giden kod geçersiz');
  assert.strictEqual(ctx.authEpostaDogrula(r.bilet, yeniKod).ok, true);
  assert.strictEqual(ctx.authGirisYap('can', 'can-sifre-12').ok, true);
  assert.strictEqual(ctx.authEpostaKoduGonder('a'.repeat(64)).yenidenGiris, true, 'geçersiz bilet');
  // Günlük sınır
  var d = ctx.authKayitOl('Deniz', 'deniz', 'deniz@ornek.com', 'deniz-sifre-1');
  for (var i = 0; i < 9; i++) { beklemeyiAtla('deniz'); assert.strictEqual(ctx.authEpostaKoduGonder(d.bilet).ok, true); }
  beklemeyiAtla('deniz');
  assert.ok(/Bugün çok fazla/.test(ctx.authEpostaKoduGonder(d.bilet).hata));
})();

// 13) Kod: 5 yanlış denemede iptal, süresi dolunca geçersiz
(function () {
  var r = ctx.authKayitOl('Ece', 'ece', 'ece@ornek.com', 'ece-sifre-123');
  var dogru = sonKod('ece@ornek.com');
  var yanlis = dogru === '123456' ? '654321' : '123456';
  for (var i = 0; i < 5; i++) ctx.authEpostaDogrula(r.bilet, yanlis);
  var son = ctx.authEpostaDogrula(r.bilet, dogru);
  assert.strictEqual(son.ok, false);
  assert.ok(/Çok fazla yanlış/.test(son.hata));
  beklemeyiAtla('ece');
  ctx.authEpostaKoduGonder(r.bilet);
  var u = JSON.parse(depo['kullanici:ece']);
  u.kod.bitis = Date.now() - 1;
  depo['kullanici:ece'] = JSON.stringify(u);
  assert.ok(/süresi dolmuş/.test(ctx.authEpostaDogrula(r.bilet, sonKod('ece@ornek.com')).hata));
})();

// 14) Doğrulanmamış hesap başkasının adresini kilitleyemez; ilk doğrulayan alır
(function () {
  var saldirgan = ctx.authKayitOl('Kötü', 'kotu', 'hedef@ornek.com', 'kotu-sifre-1');
  var asil = ctx.authKayitOl('Asıl Sahip', 'asil', 'hedef@ornek.com', 'asil-sifre-1');
  assert.strictEqual(asil.dogrulama, true, 'doğrulanmamış adres yeni kayda engel olmaz');
  assert.strictEqual(ctx.authEpostaDogrula(asil.bilet, sonKod('hedef@ornek.com')).ok, true);
  beklemeyiAtla('kotu');
  var dene = ctx.authEpostaKoduGonder(saldirgan.bilet);
  assert.strictEqual(dene.ok, false);
  assert.ok(/başka bir hesapta/.test(dene.hata));
})();

// 15) E-postası olmayan eski hesap: girişte e-posta ister, eski oturumu geçersizdir
(function () {
  var tuz = 'eski-tuz';
  depo['kullanici:eski'] = JSON.stringify({ ad: 'Eski Hesap', tuz: tuz, hash: ctx.authHashle('eski-sifre-1', tuz), olusturma: 1 });
  var eskiOturum = ctx.authOturumAc('eski', 'Eski Hesap').token;
  assert.strictEqual(ctx.authOturum(eskiOturum).ok, false, 'doğrulanmamış hesabın oturumu geçersiz');
  var g = ctx.authGirisYap('eski', 'eski-sifre-1');
  assert.strictEqual(g.dogrulama, true);
  assert.strictEqual(g.epostaGerekli, true);
  assert.ok(/Önce e-posta/.test(ctx.authEpostaDogrula(g.bilet, '123456').hata));
  assert.strictEqual(ctx.authEpostaKoduGonder(g.bilet, 'eski@ornek.com').ok, true);
  var o = ctx.authEpostaDogrula(g.bilet, sonKod('eski@ornek.com'));
  assert.strictEqual(o.ok, true);
  assert.strictEqual(ctx.authGirisYap('eski', 'eski-sifre-1').ok, true);
  // Yanlış şifreyle doğrulama ekranına geçilemez
  depo['kullanici:eski2'] = JSON.stringify({ ad: 'Eski 2', tuz: tuz, hash: ctx.authHashle('eski-sifre-2', tuz), olusturma: 1 });
  var y = ctx.authGirisYap('eski2', 'yanlis-sifre');
  assert.strictEqual(y.dogrulama, undefined);
  assert.strictEqual(y.bilet, undefined);
})();

// 16) Şifre yenileme: kullanıcı adı ya da e-postayla; yanıt hesabın varlığını belli etmez
(function () {
  beklemeyiAtla('zeynep');
  var once = postalar.length;
  var yok = ctx.authSifreKoduIste('olmayan@ornek.com');
  var yok2 = ctx.authSifreKoduIste('olmayan.kisi');
  var var1 = ctx.authSifreKoduIste('Zeynep@Ornek.com');
  var hemen = ctx.authSifreKoduIste('zeynep');
  assert.strictEqual(yok.mesaj, var1.mesaj);
  assert.strictEqual(JSON.stringify(hemen), JSON.stringify(yok), 'bekleme sırasında da aynı yanıt');
  assert.strictEqual(yok2.mesaj, var1.mesaj);
  assert.strictEqual(postalar.length, once + 1, 'yalnızca var olan hesaba kod gider');
  assert.ok(/şifre yenileme/.test(postalar[postalar.length - 1].subject));
  var eskiOturum = ctx.authGirisYap('zeynep', 'zeynep-sifre-1').token;
  var kod = sonKod('zeynep@ornek.com');
  assert.strictEqual(ctx.authSifreSifirla('zeynep', kod, 'kisa').ok, false, 'kısa şifre');
  assert.strictEqual(ctx.authSifreSifirla('zeynep', kod === '000000' ? '111111' : '000000', 'yeni-zeynep-1').ok, false);
  var s = ctx.authSifreSifirla('zeynep', kod, 'yeni-zeynep-1');
  assert.strictEqual(s.ok, true, JSON.stringify(s));
  assert.strictEqual(ctx.authOturum(eskiOturum).ok, false, 'şifre değişince eski oturumlar kapanır');
  assert.strictEqual(ctx.authGirisYap('zeynep', 'zeynep-sifre-1').ok, false);
  assert.strictEqual(ctx.authGirisYap('zeynep', 'yeni-zeynep-1').ok, true);
  assert.strictEqual(ctx.authSifreSifirla('zeynep', kod, 'baska-sifre-9').ok, false, 'kod tek kullanımlık');
  // Doğrulanmamış adres kullanıcı adıyla bulunur ve şifre yenilemesi adresi doğrular
  ctx.authKayitOl('Fatma', 'fatma', 'fatma@ornek.com', 'fatma-sifre-1');
  beklemeyiAtla('fatma');
  assert.strictEqual(ctx.authSifreKoduIste('fatma@ornek.com').ok, true);
  ctx.authSifreKoduIste('fatma');
  var f = ctx.authSifreSifirla('fatma', sonKod('fatma@ornek.com'), 'fatma-yeni-12');
  assert.strictEqual(f.ok, true, JSON.stringify(f));
  assert.strictEqual(depo['eposta:fatma@ornek.com'], 'fatma');
})();

// 16b) Doğrulamadan hemen sonra şifre kodu istenebilir (bekleme türe göre)
(function () {
  var r = ctx.authKayitOl('Hızlı', 'hizli', 'hizli@ornek.com', 'hizli-sifre-1');
  ctx.authEpostaDogrula(r.bilet, sonKod('hizli@ornek.com'));
  var once = postalar.length;
  ctx.authSifreKoduIste('hizli');
  assert.strictEqual(postalar.length, once + 1, 'şifre kodu bekleme olmadan gider');
  ctx.authSifreKoduIste('hizli');
  assert.strictEqual(postalar.length, once + 1, 'aynı tür ikinci istek bekler');
})();

// 17) Gönderim hatası ve kota: hesap açılmaz, anlaşılır hata döner
(function () {
  postaHatasi = true;
  var r = ctx.authKayitOl('Gül', 'gul', 'gul@ornek.com', 'gul-sifre-12');
  assert.strictEqual(r.ok, false);
  assert.ok(/gönderilemedi/.test(r.hata));
  assert.strictEqual(depo['kullanici:gul'], undefined);
  postaHatasi = false;
  kota = 0;
  assert.ok(/gönderim sınırına/.test(ctx.authKayitOl('Gül', 'gul', 'gul@ornek.com', 'gul-sifre-12').hata));
  kota = 100;
  assert.strictEqual(kayitVeDogrula('Gül', 'gul', 'gul@ornek.com', 'gul-sifre-12').ok, true);
})();

console.log('Tüm giriş testleri geçti.');
