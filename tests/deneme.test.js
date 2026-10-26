// Çalıştırma: node tests/deneme.test.js
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'Deneme.gs'), 'utf8'), ctx);

function yakin(gercek, beklenen, mesaj) {
  assert.ok(Math.abs(gercek - beklenen) < 0.001, mesaj + ': ' + gercek + ' != ' + beklenen);
}

// Okul sonuç çizelgesine benzer, uydurma veri: TYT (120 soru) + AYT (Tarih ve Coğrafya iki kez),
// toplam sütunları, puan ve sıra sütunları, AYT'ye girmeyen bir öğrenci, ortalama satırı.
var TYT = [['TÜR', 40], ['TAR', 5], ['COĞ', 5], ['FEL', 5], ['DİN', 5], ['MAT', 30], ['GEO', 10], ['FİZ', 7], ['KİM', 7], ['BİY', 6]];
var AYT = [['TÜR', 24], ['TAR', 10], ['COĞ', 6], ['TAR', 11], ['COĞ', 11], ['FEL', 12]];
var baslik = ['SINIF', 'Adı Soyadı'];
TYT.concat(AYT).forEach(function (d) { baslik.push(d[0] + '-SS', d[0] + '-D', d[0] + '-Y'); });
baslik.push('TOP-SS', 'TOP-D', 'TOP-Y', 'TYT-Puan', 'TYT-Sınıf', 'TYT-Okul', 'TYT-Genel', 'SÖZ-Puan', 'SÖZ-Sınıf');

function satir(ad, tyt, ayt, puanlar) {
  var r = ['12-A', ad];
  TYT.forEach(function (d, i) { r.push(d[1], tyt[i][0], tyt[i][1]); });
  AYT.forEach(function (d, i) { r.push(ayt ? d[1] : '', ayt ? ayt[i][0] : '', ayt ? ayt[i][1] : ''); });
  return r.concat([0, 0, 0], puanlar);
}
var sifir = TYT.map(function () { return [0, 0]; });
var aytSifir = AYT.map(function () { return [0, 0]; });

var t1 = sifir.slice(); t1[0] = [30, 8]; t1[5] = [20, 4];       // Türkçe 28, Mat 19 → 47
var a1 = aytSifir.slice(); a1[0] = [20, 4]; a1[1] = [6, 0]; a1[3] = [4, 2]; // 19 + 6 + 3,5
var t2 = sifir.slice(); t2[0] = [20, 12]; t2[5] = ['5', '3'];   // metin olarak sayılar: 17 + 4,25
var a2 = aytSifir.slice(); a2[0] = [10, 6];                     // 8,5
var t3 = sifir.slice(); t3[0] = [10, 20];                        // 5

var satirlar = [
  satir('Ayşe Yılmaz', t1, a1, [300.5, 1, 2, 1500, 250, 1]),
  satir('Mehmet Kaya', t2, a2, [220, 2, 4, 2500, 0, '']),
  satir('Zeynep Demir', t3, null, [180, 3, 6, 3000, 0, '']),
  ['ORTALAMA', ''].concat(baslik.slice(2).map(function () { return 1; }))
];
// Ortalama satırı ad sütununda değil ilk sütunda yazıyorsa da atlanmalı
satirlar[3][1] = '';

// 1) Sütunlar ve oturumlar
(function () {
  var b = ctx.denemeSutunlariBul(baslik);
  assert.ok(b, 'deneme biçimi bulunmalı');
  assert.strictEqual(b.dersler.length, 16, 'TOP sütunları ders sayılmamalı');
  assert.strictEqual(b.oturumSayisi, 2);
  assert.strictEqual(b.dersler.filter(function (d) { return d.oturum === 0; }).length, 10);
  assert.strictEqual(JSON.stringify(b.puanlar.map(function (p) { return p.ad; })), JSON.stringify(['TYT', 'SÖZ']));
  assert.strictEqual(ctx.denemeSutunlariBul(['Ad Soyad', 'S1', 'S2', 'Toplam']), null, 'soru bazlı dosya deneme değildir');
})();

var a = ctx.denemeAnaliziYap({ baslik: baslik, satirlar: satirlar, yanlisKatsayi: 4 });

// 2) Oturum adları, ders adları ve soru sayıları
(function () {
  assert.strictEqual(a.gecerli, true);
  assert.strictEqual(a.ogrenciSayisi, 3, 'ortalama satırı öğrenci sayılmamalı');
  assert.strictEqual(a.adSutunu, 1);
  var tyt = a.oturumlar[0];
  var ayt = a.oturumlar[1];
  assert.strictEqual(tyt.ad, 'TYT');
  assert.strictEqual(ayt.ad, 'AYT');
  assert.strictEqual(tyt.soruSayisi, 120);
  assert.strictEqual(ayt.soruSayisi, 74);
  assert.strictEqual(JSON.stringify(ayt.dersler.map(function (d) { return d.kod; })), JSON.stringify(['TÜR', 'TAR-1', 'COĞ-1', 'TAR-2', 'COĞ-2', 'FEL']));
  assert.strictEqual(ayt.dersler[0].ad, 'Türk Dili ve Edebiyatı');
  assert.strictEqual(tyt.dersler[0].ad, 'Türkçe');
  assert.strictEqual(ayt.dersler[3].ad, 'Tarih-2');
})();

// 3) Netler, sıralama, girmeyen öğrenci
(function () {
  var tyt = a.oturumlar[0];
  assert.strictEqual(tyt.n, 3);
  assert.strictEqual(tyt.siralama[0].ad, 'Ayşe Yılmaz');
  yakin(tyt.siralama[0].net, 47, 'Ayşe TYT net');
  yakin(tyt.siralama[1].net, 21.25, 'Mehmet TYT net (metin sayılar)');
  yakin(tyt.siralama[2].net, 5, 'Zeynep TYT net');
  yakin(tyt.ortalamaNet, (47 + 21.25 + 5) / 3, 'TYT ortalama');
  yakin(tyt.dersler[0].ortD, 20, 'Türkçe ortalama doğru');
  yakin(tyt.dersler[0].ortB, (2 + 8 + 10) / 3, 'Türkçe ortalama boş');
  yakin(tyt.dersler[0].basari, ((28 + 17 + 5) / 3) / 40, 'Türkçe başarı');

  var ayt = a.oturumlar[1];
  assert.strictEqual(ayt.n, 2, 'AYT hücreleri boş olan öğrenci girmemiş sayılmalı');
  assert.strictEqual(ayt.girmeyen, 1);
  yakin(ayt.siralama[0].net, 28.5, 'Ayşe AYT net');
  yakin(ayt.siralama[1].net, 8.5, 'Mehmet AYT net');
})();

// 4) Yanlış katsayısı
(function () {
  var b = ctx.denemeAnaliziYap({ baslik: baslik, satirlar: satirlar, yanlisKatsayi: 3 });
  yakin(b.oturumlar[0].siralama[2].net, 10 - 20 / 3, 'LGS usulü net');
  var c = ctx.denemeAnaliziYap({ baslik: baslik, satirlar: satirlar, yanlisKatsayi: 0 });
  yakin(c.oturumlar[0].siralama[0].net, 50, 'yanlış götürmezse net = doğru');
})();

// 5) Puanlar: 0 puan hesaplanmamış sayılır
(function () {
  var p = a.puanlar;
  assert.strictEqual(JSON.stringify(p.turler.map(function (t) { return t.ad; })), JSON.stringify(['TYT', 'SÖZ']));
  assert.strictEqual(p.turler[0].n, 3);
  assert.strictEqual(p.turler[1].n, 1);
  yakin(p.turler[0].ortalama, (300.5 + 220 + 180) / 3, 'TYT puan ortalaması');
  assert.strictEqual(p.ogrenciler[0].ad, 'Ayşe Yılmaz');
  assert.strictEqual(p.ogrenciler[0].degerler[0].genel, 1500);
  assert.strictEqual(p.ogrenciler[1].degerler[1], null);
})();

// 6) Tutarsız satır ve uyarılar
(function () {
  var r = satir('Can Koç', TYT.map(function (d, i) { return i === 1 ? [4, 3] : [0, 0]; }), null, [150, 4, 8, 3500, 0, '']);
  var b = ctx.denemeAnaliziYap({ baslik: baslik, satirlar: satirlar.concat([r]) });
  assert.strictEqual(b.tutarsiz.length, 1);
  assert.strictEqual(b.tutarsiz[0].ders, 'TAR');
  assert.ok(b.oturumlar[0].dersler[5].cokBos === true, 'Matematikte çoğu boş');
})();

// 7) Boşluklu başlıklar ve SS sütunu olmayan biçim (TÜRKÇE D, TÜRKÇE Y, TÜRKÇE NET)
(function () {
  var bas = ['Öğrenci No', 'Ad Soyad', 'Türkçe D', 'Türkçe Y', 'Türkçe Net', 'Matematik D', 'Matematik Y', 'Matematik Net'];
  var b = ctx.denemeAnaliziYap({
    baslik: bas,
    satirlar: [[1, 'Ali Can', 15, 3, 14, 10, 4, 9], [2, 'Elif Su', 18, 2, 17.5, 16, 4, 15]],
    yanlisKatsayi: 3
  });
  assert.strictEqual(b.gecerli, true);
  assert.strictEqual(b.oturumlar.length, 1);
  assert.strictEqual(b.oturumlar[0].ad, 'Deneme');
  assert.strictEqual(b.oturumlar[0].dersler[0].soru, 20, 'SS yoksa D+Y en büyüğü');
  assert.strictEqual(b.ssTahmin.length, 2);
  yakin(b.oturumlar[0].siralama[0].net, 18 - 2 / 3 + 16 - 4 / 3, 'Elif net');
})();

console.log('Deneme testleri geçti.');
