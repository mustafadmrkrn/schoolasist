// Çalıştırma: node tests/sinav.test.js
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'Sinav.gs'), 'utf8'),
  ctx
);

function yakin(gercek, beklenen, mesaj) {
  assert.ok(Math.abs(gercek - beklenen) < 0.001, mesaj + ': ' + gercek + ' != ' + beklenen);
}

var girdi = {
  gecmeNotu: 50,
  sorular: [
    { no: 1, puan: 10, kazanim: 'K1' },
    { no: 2, puan: 10, kazanim: 'K1' }
  ],
  ogrenciler: [
    { ad: 'A', puanlar: [10, 10] },
    { ad: 'B', puanlar: [8, 6] },
    { ad: 'C', puanlar: [4, 6] },
    { ad: 'D', puanlar: [0, 2] }
  ]
};

// 1) Sınıf özeti
(function () {
  var a = ctx.sinavAnaliziYap(girdi);
  assert.strictEqual(a.gecerli, true);
  assert.strictEqual(a.n, 4);
  yakin(a.ortalama, 57.5, 'ortalama');
  yakin(a.medyan, 60, 'medyan');
  yakin(a.enYuksek, 100, 'en yüksek');
  yakin(a.enDusuk, 10, 'en düşük');
  yakin(a.stdSapma, 32.6918, 'standart sapma');
  assert.strictEqual(a.gecenSayisi, 3);
  yakin(a.gecmeOrani, 0.75, 'geçme oranı');
})();

// 2) Soru güçlüğü ve ayırt edicilik
(function () {
  var a = ctx.sinavAnaliziYap(girdi);
  yakin(a.sorular[0].guclukDeger, 0.55, 'S1 güçlük');
  assert.strictEqual(a.sorular[0].guclukEtiket, 'Orta');
  yakin(a.sorular[0].ayirtDeger, 1.0, 'S1 ayırt edicilik');
  yakin(a.sorular[1].ayirtDeger, 0.8, 'S2 ayırt edicilik');
  assert.strictEqual(a.sorular[0].ayirtEtiket, 'Çok iyi');
})();

// 3) Kazanım başarısı eşiğin altındaysa tekrar önerilir
(function () {
  var a = ctx.sinavAnaliziYap(girdi);
  assert.strictEqual(a.kazanimlar.length, 1);
  yakin(a.kazanimlar[0].oran, 0.575, 'kazanım oranı');
  assert.strictEqual(a.kazanimlar[0].tekrar, true);
  assert.strictEqual(JSON.stringify(a.kazanimlar[0].sorular), '[1,2]');
})();

// 4) Soru puanını aşan değer sıkıştırılır, eksik ve geçersiz değer 0 sayılır
(function () {
  var a = ctx.sinavAnaliziYap({
    sorular: [{ puan: 10, kazanim: '' }, { puan: 10, kazanim: '' }],
    ogrenciler: [{ ad: 'X', puanlar: [15, 'abc'] }]
  });
  yakin(a.siralama[0].toplam, 10, 'sıkıştırılmış toplam');
  assert.strictEqual(a.kazanimlar.length, 0);
})();

// 5) Eşit puan aynı sırayı alır
(function () {
  var a = ctx.sinavAnaliziYap({
    sorular: [{ puan: 10 }],
    ogrenciler: [
      { ad: 'A', puanlar: [9] },
      { ad: 'B', puanlar: [7] },
      { ad: 'C', puanlar: [7] },
      { ad: 'D', puanlar: [3] }
    ]
  });
  assert.strictEqual(
    JSON.stringify(a.siralama.map(function (s) { return s.sira; })),
    '[1,2,2,4]'
  );
})();

// 6) Dağılım toplamı öğrenci sayısına eşit, sınır değerler doğru kovaya düşer
(function () {
  var a = ctx.sinavAnaliziYap({
    sorular: [{ puan: 100 }],
    ogrenciler: [24, 25, 44, 45, 54, 55, 69, 70, 84, 85, 100].map(function (p, i) {
      return { ad: 'O' + i, puanlar: [p] };
    })
  });
  var toplam = a.dagilim.reduce(function (t, d) { return t + d.sayi; }, 0);
  assert.strictEqual(toplam, 11);
  assert.strictEqual(
    JSON.stringify(a.dagilim.map(function (d) { return d.sayi; })),
    '[1,2,2,2,2,2]'
  );
})();

// 7) Veri yetersizse geçersiz döner
(function () {
  assert.strictEqual(ctx.sinavAnaliziYap({ sorular: [], ogrenciler: [] }).gecerli, false);
  assert.strictEqual(
    ctx.sinavAnaliziYap({ sorular: [{ puan: 0 }], ogrenciler: [{ ad: 'A', puanlar: [1] }] }).gecerli,
    false
  );
})();

// 8) Dörtten az öğrencide ayırt edicilik hesaplanmaz
(function () {
  var a = ctx.sinavAnaliziYap({
    sorular: [{ puan: 10 }],
    ogrenciler: [{ ad: 'A', puanlar: [5] }, { ad: 'B', puanlar: [7] }]
  });
  assert.strictEqual(a.sorular[0].ayirtDeger, null);
  assert.strictEqual(a.sorular[0].ayirtEtiket, 'Yetersiz veri');
})();

console.log('Tüm sınav testleri geçti.');
