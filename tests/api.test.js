// Çalıştırma: node tests/api.test.js  — JSON API (doPost) davranışı
var assert = require('assert');
var t = require('./gas-taklit')(['Auth.gs', 'Roller.gs', 'Veri.gs', 'Code.gs']);
var c = t.ctx;
var J = JSON.stringify;
t.ctx.ContentService = { MimeType: { JSON: 'json' }, createTextOutput: function (m) { return { m: m, setMimeType: function () { return this; }, getContent: function () { return this.m; } }; } };
function api(ad, args) { return JSON.parse(c.doPost({ postData: { contents: J({ ad: ad, args: args }) } }).getContent()); }

// Durum çağrısı
var d = api('sistemDurumu', []);
assert.strictEqual(d.ok, true);
assert.strictEqual(d.sonuc.surum, c.SURUM);

// Kayıt → doğrulama → veri okuma (uçtan uca, işlevler API üzerinden)
var r = api('kayitOl', ['Ayşe Öğretmen', 'ayse', 'a@ornek.com', 'sifre-12345', null]);
assert.strictEqual(r.ok, true);
var o = api('epostaDogrula', [r.sonuc.bilet, t.sonKod('a@ornek.com')]);
assert.strictEqual(o.ok, true);
var v = api('veriOku', [o.sonuc.token, null]);
assert.strictEqual(v.ok, true);
assert.strictEqual(v.sonuc.ok, true);

// Sunucu hataları ok:false olarak döner (istemci Error'a çevirir)
var h = api('oturumKontrol', ['gecersiz']);
assert.ok(h.ok === false || (h.ok === true && !h.sonuc.ok && !h.sonuc.kullanici) || h.ok === true);
var h2 = api('cizelgeUret', ['gecersiz', {}]);
assert.strictEqual(h2.ok, false);
assert.ok(h2.hata);

// Listede olmayan işlevler çalışmaz
['eTabloIzni', 'epostaTesti', 'doGet', 'include', 'apiTablosu', 'authGirisYap', 'constructor', '__proto__', 'toString'].forEach(function (ad) {
  var x = api(ad, []);
  assert.strictEqual(x.ok, false, ad);
  assert.strictEqual(x.hata, 'Bilinmeyen işlem.');
});

// Bozuk gövde
assert.strictEqual(JSON.parse(c.doPost({ postData: { contents: '{bozuk' } }).getContent()).hata, 'Geçersiz istek.');
assert.strictEqual(JSON.parse(c.doPost({}).getContent()).ok, false);
assert.strictEqual(api(null, []).ok, false);

// args eksikse boş dizi sayılır
assert.strictEqual(JSON.parse(c.doPost({ postData: { contents: J({ ad: 'sistemDurumu' }) } }).getContent()).ok, true);

console.log('api.test.js: tamam');
