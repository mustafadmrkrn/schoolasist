// Çalıştırma: node tests/nobet.test.js
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'Nobet.gs'), 'utf8'),
  ctx
);

function tumGunler() {
  return [0, 1, 2, 3, 4];
}

function ogretmenUret(n, gunler) {
  var liste = [];
  for (var i = 1; i <= n; i++) {
    liste.push({ ad: 'Ogretmen ' + (i < 10 ? '0' + i : i), gunler: gunler || tumGunler() });
  }
  return liste;
}

// 1) Aynı öğretmen aynı gün iki yerde görev almaz
(function () {
  var s = ctx.olusturNobetCizelgesi({
    yerler: [{ ad: 'Bahçe', kisi: 2 }, { ad: 'Kat 1', kisi: 2 }, { ad: 'Kantin', kisi: 1 }],
    ogretmenler: ogretmenUret(10)
  });
  var gorulen = {};
  s.atamalar.forEach(function (a) {
    var anahtar = a.gun + '|' + a.ogretmen;
    assert.ok(!gorulen[anahtar], 'Aynı gün iki görev: ' + anahtar);
    gorulen[anahtar] = true;
  });
  assert.strictEqual(s.atamalar.length, 25);
  assert.strictEqual(s.uyarilar.length, 0);
})();

// 2) Dağılım adil: en çok ve en az nöbet farkı en fazla 1
(function () {
  var s = ctx.olusturNobetCizelgesi({
    yerler: [{ ad: 'Bahçe', kisi: 2 }, { ad: 'Kat 1', kisi: 1 }],
    ogretmenler: ogretmenUret(7)
  });
  var degerler = Object.keys(s.sayaclar).map(function (k) {
    return s.sayaclar[k];
  });
  var fark = Math.max.apply(null, degerler) - Math.min.apply(null, degerler);
  assert.ok(fark <= 1, 'Dağılım adil değil, fark: ' + fark);
})();

// 3) Müsait olmadığı güne atanmaz
(function () {
  var ogretmenler = [
    { ad: 'A', gunler: [0] },
    { ad: 'B', gunler: [0, 1, 2, 3, 4] }
  ];
  var s = ctx.olusturNobetCizelgesi({
    yerler: [{ ad: 'Bahçe', kisi: 1 }],
    ogretmenler: ogretmenler
  });
  s.atamalar.forEach(function (a) {
    if (a.ogretmen === 'A') assert.strictEqual(a.gun, 0);
  });
})();

// 4) Yeterli öğretmen yoksa uyarı verir
(function () {
  var s = ctx.olusturNobetCizelgesi({
    gunler: [0],
    yerler: [{ ad: 'Bahçe', kisi: 3 }],
    ogretmenler: ogretmenUret(2)
  });
  assert.strictEqual(s.atamalar.length, 2);
  assert.strictEqual(s.uyarilar.length, 1);
  assert.ok(s.uyarilar[0].indexOf('Pazartesi') === 0);
})();

// 5) haftalikMax aşılmaz
(function () {
  var ogretmenler = ogretmenUret(2);
  ogretmenler[0].haftalikMax = 1;
  var s = ctx.olusturNobetCizelgesi({
    yerler: [{ ad: 'Bahçe', kisi: 1 }],
    ogretmenler: ogretmenler
  });
  assert.ok(s.sayaclar[ogretmenler[0].ad] <= 1);
})();

// 6) Altı hafta: her hafta tüm kontenjan dolar, aynı gün iki görev yok, toplam dağılım adil,
//    haftalık sınır her hafta ayrı uygulanır, yerler haftalar arasında döner
(function () {
  var ogretmenler = ogretmenUret(12);
  ogretmenler[0].haftalikMax = 1;
  ogretmenler[1].gunler = [0, 2, 4];
  var s = ctx.olusturNobetCizelgesi({
    yerler: [{ ad: 'Bahçe', kisi: 2 }, { ad: 'Zemin', kisi: 1 }, { ad: 'Kantin', kisi: 1 }],
    ogretmenler: ogretmenler,
    haftaSayisi: 6
  });
  assert.strictEqual(s.atamalar.length, 6 * 5 * 4);
  assert.strictEqual(s.uyarilar.length, 0);
  assert.strictEqual(s.haftalik.length, 6);
  var gorulen = {};
  s.atamalar.forEach(function (a) {
    assert.ok(a.hafta >= 0 && a.hafta < 6);
    var k = a.hafta + '|' + a.gun + '|' + a.ogretmen;
    assert.ok(!gorulen[k], 'Aynı gün iki görev: ' + k);
    gorulen[k] = 1;
    if (a.ogretmen === ogretmenler[1].ad) assert.ok([0, 2, 4].indexOf(a.gun) > -1);
  });
  s.haftalik.forEach(function (h) { assert.ok(h[ogretmenler[0].ad] <= 1, 'haftalık sınır aşıldı'); });
  var serbest = Object.keys(s.sayaclar).filter(function (k) { return k !== ogretmenler[0].ad; }).map(function (k) { return s.sayaclar[k]; });
  var fark = Math.max.apply(null, serbest) - Math.min.apply(null, serbest);
  assert.ok(fark <= 1, '6 haftalık dağılım adil değil, fark: ' + fark + ' ' + JSON.stringify(s.sayaclar));
  // Kimse 6 hafta boyunca hep aynı yerde olmasın
  var yerler = {};
  s.atamalar.forEach(function (a) { (yerler[a.ogretmen] = yerler[a.ogretmen] || {})[a.yer] = 1; });
  Object.keys(yerler).forEach(function (ad) {
    if (s.sayaclar[ad] >= 4) assert.ok(Object.keys(yerler[ad]).length >= 2, ad + ' hep aynı yerde');
  });
  // Haftalar birbirinin aynısı olmasın
  var hafta = function (h) { return JSON.stringify(s.atamalar.filter(function (a) { return a.hafta === h; }).map(function (a) { return a.gun + a.yer + a.ogretmen; })); };
  assert.notStrictEqual(hafta(0), hafta(1));
  // Varsayılan tek hafta, atamalarda hafta 0
  var t = ctx.olusturNobetCizelgesi({ yerler: [{ ad: 'B', kisi: 1 }], ogretmenler: ogretmenUret(3) });
  assert.ok(t.atamalar.every(function (a) { return a.hafta === 0; }));
  assert.strictEqual(t.haftalik.length, 1);
})();

console.log('Tüm testler geçti.');
