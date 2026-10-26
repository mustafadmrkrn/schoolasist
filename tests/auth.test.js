// Çalıştırma: node tests/auth.test.js
// Apps Script servisleri (Utilities, PropertiesService, CacheService, LockService)
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
  }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'Auth.gs'), 'utf8'), ctx);

// 1) Kayıt başarılı, belirteç oturumu doğrular
var kayit = ctx.authKayitOl('Ayşe Demir', 'Ayse.Demir', 'guclu-sifre-1');
assert.strictEqual(kayit.ok, true);
assert.strictEqual(kayit.kullanici, 'ayse.demir', 'kullanıcı adı küçük harfe çevrilir');
assert.strictEqual(kayit.ad, 'Ayşe Demir');
var oturum = ctx.authOturum(kayit.token);
assert.strictEqual(oturum.ok, true);
assert.strictEqual(oturum.kullanici, 'ayse.demir');
assert.strictEqual(oturum.ad, 'Ayşe Demir');

// 2) Şifre ve belirteç düz metin saklanmaz
var tumDepo = JSON.stringify(depo);
assert.ok(tumDepo.indexOf('guclu-sifre-1') === -1, 'şifre depoda görünüyor');
assert.ok(tumDepo.indexOf(kayit.token) === -1, 'oturum belirteci depoda görünüyor');

// 3) Aynı kullanıcı adı (harf büyüklüğü farklı olsa da) reddedilir
var yinelenen = ctx.authKayitOl('Başka', 'AYSE.DEMIR', 'baska-sifre-1');
assert.strictEqual(yinelenen.ok, false);
assert.ok(/alınmış/.test(yinelenen.hata));

// 4) Geçersiz girdiler reddedilir
assert.strictEqual(ctx.authKayitOl('', 'ali', 'sifre1234').ok, false, 'boş ad');
assert.strictEqual(ctx.authKayitOl('Ali', 'a', 'sifre1234').ok, false, 'kısa kullanıcı adı');
assert.strictEqual(ctx.authKayitOl('Ali', 'ali veli', 'sifre1234').ok, false, 'boşluklu kullanıcı adı');
assert.strictEqual(ctx.authKayitOl('Ali', 'ali.yilmaz', '1234567').ok, false, '7 karakterlik şifre');
assert.strictEqual(ctx.authKayitOl('Ali', 'aliyilmaz', 'aliyilmaz').ok, false, 'şifre = kullanıcı adı');

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
ctx.authKayitOl('Mehmet Kaya', 'mehmet', 'mehmet-sifre-1');
for (var i = 0; i < 5; i++) ctx.authGirisYap('mehmet', 'yanlis-' + i);
var kilitli = ctx.authGirisYap('mehmet', 'mehmet-sifre-1');
assert.strictEqual(kilitli.ok, false);
assert.ok(/Çok fazla/.test(kilitli.hata));
assert.strictEqual(ctx.authGirisYap('ayse.demir', 'guclu-sifre-1').ok, true);

// 7) Başarılı giriş hatalı deneme sayacını sıfırlar
ctx.authKayitOl('Zeynep Çelik', 'zeynep', 'zeynep-sifre-1');
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

console.log('Tüm giriş testleri geçti.');
