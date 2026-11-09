// Çalıştırma: node tests/karne.test.js
// Gerçek öğrenci verisi kullanılmaz; veli karnesi dışa aktarımının yapısında uydurma bir örnek üretilir.
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var html = fs.readFileSync(path.join(__dirname, '..', 'src', 'karne-cekirdek.html'), 'utf8');
var kod = html.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
var ctx = {};
vm.createContext(ctx);
vm.runInContext(kod, ctx);

var TYT = ['TURTYT', 'TARTYT', 'COGTYT', 'FEL-T', 'DİN-T', 'MATTYT', 'GEOTYT', 'FİZ-T', 'KİM-T', 'BİY-T'];
var AYT = ['TDEAYT', 'TAR1AYT', 'COG1AYT', 'TAR2AYT', 'COG2AYT', 'FELAYT', 'DİNAYT', 'MATAYT', 'GEOAYT', 'FIZAYT', 'KIMAYT', 'BIYAYT'];
var SORU = { TURTYT: 40, TARTYT: 5, COGTYT: 5, 'FEL-T': 5, 'DİN-T': 5, MATTYT: 30, GEOTYT: 10, 'FİZ-T': 7, 'KİM-T': 7, 'BİY-T': 6,
  TDEAYT: 24, TAR1AYT: 10, COG1AYT: 6, TAR2AYT: 11, COG2AYT: 11, FELAYT: 12, DİNAYT: 6, MATAYT: 31, GEOAYT: 9, FIZAYT: 14, KIMAYT: 13, BIYAYT: 13 };
function td(x) { return '<td> ' + x + ' </td>'; }
function netSatir(ad, dersler, d) {
  return '<tr class="satir0"><td class="baslik">' + ad + '</td>' + dersler.map(function (c) {
    var x = d[c] || [0, 0]; var S = SORU[c]; return td(S) + td(x[0]) + td(x[1]) + td(x[0] - x[1] / 4);
  }).join('') + '</tr>';
}
function karne(o) {
  var puanBas = ['SAY', 'SÖZ', 'EA', 'TYT'].map(function (t) { return '<td>' + t + '</td><td>' + t + ' Sınıf Sıra</td><td>' + t + ' Okul Sıra</td><td>' + t + ' Genel Sıra</td><td>' + t + ' %lik Dilim</td>'; }).join('');
  var dersler = TYT.concat(AYT);
  return '<td>VELİ KARNESİ</td><table class="ogrenci_bilgi"><tr><td>Adı:</td><td>' + o.ad + '</td></tr><tr><td>Numarası:</td><td>' + o.no + '</td></tr>' +
    '<tr><td>Sınıfı:</td><td>' + o.sinif + '</td></tr><tr><td>Şubesi:</td><td>DENEME LİSESİ</td></tr></table>' +
    '<table class="border_cizgili"><tr><td colspan="50" class="baslik">YÜKSEKÖĞRETİM KURUMLARI SINAVI Puanlar</td></tr><tr class="baslik"><td>Sınav</td>' + puanBas + '</tr>' +
    o.yks.map(function (y) { return '<tr class="satir0"><td class="baslik">' + y.ad + '</td>' + y.puan.map(td).join('') + '</tr>'; }).join('') + '</table>' +
    '<table class="border_cizgili"><tr><td colspan="89" class="baslik">YÜKSEKÖĞRETİM KURUMLARI SINAVI Netler</td></tr><tr class="baslik"><td rowspan="2">Sınav</td>' +
    dersler.map(function (c) { return '<td colspan="4">' + c + '</td>'; }).join('') + '</tr><tr class="baslik">' + dersler.map(function () { return '<td>S</td><td>D</td><td>Y</td><td>N</td>'; }).join('') + '</tr>' +
    o.yks.map(function (y) { return netSatir(y.ad, dersler, y.net); }).join('') + '</table>' +
    '<table><tr><td colspan="2">Ders Öğretmenleri</td></tr><tr><td>FİZİK</td><td>AYŞE ÖRNEK</td></tr><tr><td>MATEMATİK TYT</td><td>ALİ DENEME</td></tr><tr><td>Sınıf Öğretmeni</td><td> </td></tr></table>';
}
function tyt(k) { var d = {}; TYT.forEach(function (c) { d[c] = [Math.round(SORU[c] * k), Math.round(SORU[c] * (1 - k) / 2)]; }); return d; }
function ekle(d, e) { Object.keys(e).forEach(function (c) { d[c] = e[c]; }); return d; }
var dosya = '<html><body>' + [
  // Tam: YKS-1 dört puan (az da olsa sözel net var), YKS-2 yalnız TYT (AYT'ye girmemiş)
  karne({ ad: 'DENEME İLKER ÖRNEK', no: '1', sinif: '11-FEN Z', yks: [
    { ad: 'GM - 11 YKS 01', puan: ['400', '1/3', '1/3', '10/100', '%10', '250', '1/3', '1/3', '20/100', '%20', '350', '1/3', '1/3', '15/100', '%15', '420', '1/3', '1/3', '5/100', '%5'],
      net: ekle(tyt(0.8), { MATAYT: [25, 2], GEOAYT: [6, 1], FIZAYT: [10, 2], KIMAYT: [9, 1], BIYAYT: [8, 2], DİNAYT: [2, 0] }) },
    { ad: 'GM - 11 YKS 02', puan: ['430', '1/3', '1/3', '8/100', '%8'], net: tyt(0.85) }] }),
  // Sayısal AYT: SAY, EA, TYT (sözel neti yok)
  karne({ ad: 'IŞIL ÇALIŞKAN', no: '2', sinif: '11-FEN Z', yks: [
    { ad: 'GM - 11 YKS 01', puan: ['300', '2/3', '2/3', '50/100', '%50', '200', '2/3', '2/3', '60/100', '%60', '280', '2/3', '2/3', '55/100', '%55', '310', '2/3', '2/3', '45/100', '%45'],
      net: ekle(tyt(0.5), { MATAYT: [12, 6], FIZAYT: [3, 6], KIMAYT: [4, 4], BIYAYT: [5, 3], TDEAYT: [1, 0] }) },
    { ad: 'GM - 11 YKS 02', puan: ['290', '2/3', '2/3', '52/100', '%52', '270', '2/3', '2/3', '58/100', '%58', '300', '2/3', '2/3', '50/100', '%50'],
      net: ekle(tyt(0.45), { MATAYT: [10, 8], FIZAYT: [2, 5], KIMAYT: [3, 6], BIYAYT: [4, 3] }) }] }),
  karne({ ad: 'ZEYNEP YOK', no: '3', sinif: '11-FEN Z', yks: [] })
].join('<hr>') + '</body></html>';

var ham = ctx.karneOku(dosya);
assert.strictEqual(ham.ogrenciler.length, 3, 'üç karne okunur');
assert.strictEqual(ham.ogrenciler[0].ad, 'DENEME İLKER ÖRNEK');
assert.strictEqual(ham.ogretmenler['FİZİK'][0], 'AYŞE ÖRNEK');
assert.strictEqual(ctx.karneAdDuzelt('IŞIL ÇALIŞKAN'), 'Işıl Çalışkan', 'Türkçe büyük/küçük harf');
assert.strictEqual(ctx.karneAlanBul('12-TM'), 'TM');
assert.strictEqual(ctx.karneAlanBul('11-FEN A'), 'MF');

var m = ctx.karneSinifKur(ham, 'ornek.html');
var a = m.ogrenciler[0], b = m.ogrenciler[1], c = m.ogrenciler[2];
assert.strictEqual(m.etiket, '11-FEN Z');
assert.strictEqual(m.ana, 'SAY');
assert.strictEqual(m.yks.join(','), 'YKS-1,YKS-2');
// Puan türleri netlerden: yalnız TYT oluşan satırdaki puan TYT'dir (karnede SAY başlığı altında yazsa da)
assert.strictEqual(a.sinavlar['YKS-2'].puan.TYT.p, 430);
assert.ok(!a.sinavlar['YKS-2'].puan.SAY, 'AYT girmeyen öğrencide SAY puanı yok');
assert.strictEqual(a.sinavlar['YKS-1'].puan.SAY.p, 400);
assert.strictEqual(a.sinavlar['YKS-1'].puan['SÖZ'].p, 250);
assert.strictEqual(b.sinavlar['YKS-2'].puan.SAY.p, 290);
assert.strictEqual(b.sinavlar['YKS-2'].puan.EA.p, 270);
assert.strictEqual(b.sinavlar['YKS-2'].puan.TYT.p, 300);
assert.ok(!b.sinavlar['YKS-2'].puan['SÖZ']);
// Netler ve bloklar
assert.strictEqual(a.sinavlar['YKS-1'].tyt['Türkçe'].S, 40);
assert.ok(a.sinavlar['YKS-1'].aytN > 40);
assert.strictEqual(a.sinavlar['YKS-2'].aytN, null);
// Değerlendirme
assert.ok(a.ev.dikkat.some(function (x) { return /YKS-2’de AYT oturumuna katılmamış/.test(x); }), 'AYT katılmama uyarısı');
assert.ok(b.ev.dikkat.some(function (x) { return /yanlış/.test(x); }), 'yüksek yanlış oranı uyarısı');
assert.strictEqual(c.seviye, 'Veri yok');
assert.ok(c.ev.gundem[0].indexOf('Hiçbir denemeye') === 0);
assert.strictEqual(a.seviye, 'Üst düzey', 'ortalama dilim (%10 + %8) / 2 = %9');
assert.strictEqual(a.dilimOrt, 9);
assert.strictEqual(b.seviye, 'Gelişmeli');
assert.deepStrictEqual(JSON.parse(JSON.stringify(a.sinifIci)), [1, 2]);
assert.ok(m.ogretmenDers['AYŞE ÖRNEK'].indexOf('FIZAYT') > -1, 'ders öğretmeni eşleşir');
assert.ok(m.ist['YKS-1'].ders.MATAYT.n === 2);
console.log('karne testleri geçti');
