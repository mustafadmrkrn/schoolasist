// Çalıştırma: node tests/yillik.test.js
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var zlib = require('zlib');
var assert = require('assert');

var html = fs.readFileSync(path.join(__dirname, '..', 'src', 'yillik-cekirdek.html'), 'utf8');
var ctx = {};
vm.createContext(ctx);
vm.runInContext(html.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, ''), ctx);
var J = function (x) { return JSON.stringify(x); };

// Küçük ZIP okuyucu (yalnızca test için): bir dosyanın içeriğini döndürür
function zipDosya(buf, ad) {
  var e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  var n = buf.readUInt16LE(e + 10), o = buf.readUInt32LE(e + 16);
  for (var i = 0; i < n; i++) {
    var yontem = buf.readUInt16LE(o + 10), boy = buf.readUInt32LE(o + 20);
    var al = buf.readUInt16LE(o + 28), ek = buf.readUInt16LE(o + 30), yorum = buf.readUInt16LE(o + 32);
    var yer = buf.readUInt32LE(o + 42), isim = buf.toString('utf8', o + 46, o + 46 + al);
    if (isim === ad) {
      var la = buf.readUInt16LE(yer + 26), le = buf.readUInt16LE(yer + 28);
      var veri = buf.slice(yer + 30 + la + le, yer + 30 + la + le + boy);
      return (yontem === 8 ? zlib.inflateRawSync(veri) : veri).toString('utf8');
    }
    o += 46 + al + ek + yorum;
  }
  return null;
}

var takvim = ctx.ypVarsayilanTakvim();

// 1) Takvim: 2026-2027 ders haftaları, tatiller atlanır
var haftalar = ctx.ypHaftalar(takvim);
(function () {
  assert.strictEqual(haftalar[0].bas, '2026-09-14');
  assert.strictEqual(haftalar[0].no, 1);
  var ders = haftalar.filter(function (h) { return h.no; });
  assert.strictEqual(ders.length, 37);
  assert.strictEqual(haftalar.filter(function (h) { return h.tatil; }).length, 4);
  var ara = haftalar.filter(function (h) { return h.bas === '2026-11-16'; })[0];
  assert.strictEqual(ara.tatil, '1. dönem ara tatili');
  assert.strictEqual(haftalar.filter(function (h) { return h.bas === '2026-11-23'; })[0].no, 10, 'tatilden sonra numara devam eder');
  // 26 Ekim 2026 Pazartesi = 7. hafta; Cumartesi bir sonraki haftaya sayılır
  assert.strictEqual(haftalar[ctx.ypHaftaBul(haftalar, '2026-10-26')].no, 7);
  assert.strictEqual(haftalar[ctx.ypHaftaBul(haftalar, '2026-10-31')].no, 8);
  assert.strictEqual(ctx.ypHaftaBul(haftalar, '2026-08-01'), 0, 'yıl başlamadan ilk hafta');
  assert.strictEqual(ctx.ypHaftaBul(haftalar, '2027-08-01'), haftalar.length - 1);
})();

// 2) Tarih aralığı okuma
(function () {
  var t = function (m) { return J(ctx.ypTarihAraligi(m, 2026)); };
  assert.strictEqual(t('1. Hafta: 14-18 Eylül'), J({ bas: '2026-09-14', bit: '2026-09-18' }));
  assert.strictEqual(t('28 Eylül - 02 Ekim'), J({ bas: '2026-09-28', bit: '2026-10-02' }));
  assert.strictEqual(t('28 EYLÜL-02 EKİM 2026'), J({ bas: '2026-09-28', bit: '2026-10-02' }));
  assert.strictEqual(t('04-08 Ocak'), J({ bas: '2027-01-04', bit: '2027-01-08' }), 'Ocak sonraki yıl');
  assert.strictEqual(t('14.09.2026 - 18.09.2026'), J({ bas: '2026-09-14', bit: '2026-09-18' }));
  assert.strictEqual(t('14-18.09.2026'), J({ bas: '2026-09-14', bit: '2026-09-18' }));
  assert.strictEqual(t('28 Aralık - 01 Ocak'), J({ bas: '2026-12-28', bit: '2027-01-01' }), 'yıl geçişi');
  assert.strictEqual(ctx.ypTarihAraligi('1. HAFTA', 2026), null);
  assert.strictEqual(ctx.ypTarihAraligi('9.1.1.1. Sayıları açıklar', 2026), null, 'kazanım kodu tarih sanılmaz');
  assert.strictEqual(ctx.ypHaftaNo('12. HAFTA'), 12);
  assert.strictEqual(ctx.ypHaftaNo('3.Hafta: 28 Eylül'), 3);
  assert.strictEqual(ctx.ypHaftaNo('Eylül'), null);
})();

// 3) Kazanım bölme
(function () {
  var k = ctx.ypKazanimlariAyir('M.9.1.1.1. Doğal sayıları açıklar. M.9.1.1.2. Tam sayılarla\nişlem yapar.\n• Problem çözer');
  assert.strictEqual(J(k), J(['M.9.1.1.1. Doğal sayıları açıklar.', 'M.9.1.1.2. Tam sayılarla işlem yapar.', 'Problem çözer']));
  var m = ctx.ypKazanimlariAyir('TDE.10.1.1. Anlam ilişkilerini belirleyebilme\na) Metni okur.\nb) Açıklar.');
  assert.strictEqual(m.length, 3, 'süreç bileşenleri ayrı madde');
})();

// 4) Word örneği: tarihli haftalar, birleşik AY hücreleri, tatil satırları
(function () {
  var xml = zipDosya(fs.readFileSync(path.join(__dirname, '..', 'ornekler', 'yillik-plan-ornegi.docx')), 'word/document.xml');
  var tablolar = ctx.ypDocxTablolari(xml);
  assert.strictEqual(tablolar.length, 1);
  var p = ctx.ypEnIyiPlan(tablolar, 2026);
  assert.ok(p, 'plan bulunmalı');
  var ders = p.satirlar.filter(function (s) { return !s.tatil; });
  assert.strictEqual(ders.length, 37);
  assert.strictEqual(p.satirlar.filter(function (s) { return s.tatil; }).length, 4);
  assert.strictEqual(ders[0].bas, '2026-09-14');
  assert.strictEqual(ders[0].ay, 'EYLÜL');
  assert.strictEqual(ders[2].ay, 'EYLÜL', 'birleşik AY hücresi ileri doldurulur');
  assert.strictEqual(ders[0].kazanimlar.length, 2);
  var y = ctx.ypYerlestir(p.satirlar, takvim);
  assert.strictEqual(y.kaynak, 'tarih');
  var h7 = y.haftalar[ctx.ypHaftaBul(y.haftalar, '2026-10-26')];
  assert.strictEqual(h7.satirlar.length, 1);
  assert.ok(/^7\. Hafta/.test(h7.satirlar[0].haftaMetni));
  var bas = ctx.ypDersTahmini(ctx.ypDocxBaslik(xml));
  assert.strictEqual(bas.ders, 'Matematik');
  assert.strictEqual(bas.sinif, '9. sınıf');
})();

// 5) Excel benzeri: hafta yalnızca numara, 2. dönemde 1'den başlar, Maarif başlıkları
(function () {
  var rows = [['2026-2027 10. SINIF TÜRK DİLİ VE EDEBİYATI DERSİ YILLIK PLANI'], [],
    ['AY', 'HAFTA', 'DERS SAATİ', 'TEMA', 'ÖĞRENME ÇIKTILARI VE SÜREÇ BİLEŞENLERİ', 'İÇERİK ÇERÇEVESİ']];
  var dersHaftalari = haftalar.filter(function (h) { return h.no; });
  var sayac = 0, ikinci = false;
  haftalar.forEach(function (h) {
    if (h.tatil) { rows.push(['', '', '', h.tatil.toLocaleUpperCase('tr'), '', '']); if (/Yarıyıl/.test(h.tatil) && !ikinci) { ikinci = true; sayac = 0; } return; }
    sayac++;
    rows.push([sayac === 1 || h.bas.slice(8) <= '07' ? 'AY' : '', sayac + '. HAFTA', 4, 'TEMA', 'TDE.10.' + h.no + '. Çıktı ' + h.no, 'İçerik ' + h.no]);
  });
  var p = ctx.ypPlanCikar(rows, 2026);
  assert.ok(p);
  assert.ok(p.sutunlar.indexOf('kazanim') > -1 && p.sutunlar.indexOf('konu') > -1 && p.sutunlar.indexOf('unite') > -1);
  var y = ctx.ypYerlestir(p.satirlar, takvim);
  assert.strictEqual(y.kaynak, 'numara');
  var dh = y.haftalar.filter(function (h) { return h.no; });
  assert.strictEqual(dh.length, 37);
  dh.forEach(function (h) {
    assert.strictEqual(h.satirlar.length, 1, h.no + '. haftada tek satır olmalı');
    assert.ok(new RegExp('TDE\\.10\\.' + h.no + '\\. ').test(h.satirlar[0].kazanimlar[0]), h.no + '. hafta yanlış: ' + h.satirlar[0].kazanimlar[0]);
  });
  var s = ctx.ypYerlestir(p.satirlar.map(function (x) { var c = JSON.parse(JSON.stringify(x)); delete c.hafta; return c; }), takvim);
  assert.strictEqual(s.kaynak, 'sira', 'numara da yoksa satır sırası');
  assert.ok(/TDE\.10\.20\. /.test(s.haftalar.filter(function (h) { return h.no === 20; })[0].satirlar[0].kazanimlar[0]));
})();

// 6) Aynı haftanın birden fazla satırı birleşir; başlık tekrarı atlanır
(function () {
  var rows = [
    ['AY', 'HAFTA', 'KONU', 'KAZANIMLAR'],
    ['EYLÜL', '1. Hafta (14-18 Eylül)', 'Kümeler', 'M.9.1.1.1. Kümeyi açıklar.'],
    ['', '', 'Alt küme', 'M.9.1.1.2. Alt kümeyi bulur.'],
    ['AY', 'HAFTA', 'KONU', 'KAZANIMLAR'],
    ['', '2. Hafta (21-25 Eylül)', 'Sayılar', 'M.9.1.2.1. Sayıları sıralar.']
  ];
  var p = ctx.ypPlanCikar(rows, 2026);
  assert.strictEqual(p.satirlar.length, 2);
  assert.strictEqual(p.satirlar[0].kazanimlar.length, 2);
  assert.strictEqual(p.satirlar[0].konu, 'Kümeler\nAlt küme');
  assert.strictEqual(p.satirlar[1].ay, 'EYLÜL');
  assert.strictEqual(ctx.ypPlanCikar([['Ad', 'Soyad'], ['Ali', 'Can']], 2026), null, 'plan olmayan tablo');
})();

// 7) Ders adı tahmini ve kopyalama metni
(function () {
  assert.strictEqual(J(ctx.ypDersTahmini('11_sinif_fizik_yillik_plan.xlsx')), J({ ders: 'Fizik', sinif: '11. sınıf' }));
  assert.strictEqual(ctx.ypDersTahmini('2026-2027 EĞİTİM ÖĞRETİM YILI 10. SINIF TÜRK DİLİ VE EDEBİYATI DERSİ YILLIK PLANI').ders, 'Türk Dili ve Edebiyatı');
  var m = ctx.ypHaftaMetni('Fizik', { satirlar: [{ unite: '1. ÜNİTE', konu: 'Kuvvet', kazanimlar: ['F.9.1.1. Açıklar.'] }] });
  assert.strictEqual(m, '1. ÜNİTE\nKonu: Kuvvet\nF.9.1.1. Açıklar.');
  assert.strictEqual(ctx.ypHaftaMetni('Fizik', { tatil: 'Ara tatil', satirlar: [] }), 'Fizik: Ara tatil');
  assert.strictEqual(ctx.ypAralikMetni('2026-10-26', '2026-10-30'), '26–30 Ekim 2026');
  assert.strictEqual(ctx.ypAralikMetni('2026-09-28', '2026-10-02'), '28 Eylül – 2 Ekim 2026');
})();

console.log('Yıllık plan testleri geçti.');
