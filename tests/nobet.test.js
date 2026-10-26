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

console.log('Tüm testler geçti.');
