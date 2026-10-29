// Çalıştırma: node tests/veri.test.js
var assert = require('assert');
var t = require('./gas-taklit')(['Auth.gs', 'Roller.gs', 'Veri.gs', 'Code.gs']);
var c = t.ctx;
var J = function (x) { return JSON.stringify(x); };

function kayit(ad, k, e, rolBilgi) {
  var r = c.authKayitOl(ad, k, e, k + '-sifre-1', rolBilgi);
  return c.authEpostaDogrula(r.bilet, t.sonKod(e));
}
var adlar = function (l) { return J(l.map(function (x) { return x.ad; })); };

// 1) Admin kişisel kapsam: ilk okumada E-Tablo oluşur, listeler boş
var admin = kayit('Mustafa Demirkıran', 'mustafadmrkrn', 'm@ornek.com');
var at = admin.token;
var v = c.veriOku(at);
assert.strictEqual(v.ok, true);
assert.strictEqual(v.kapsam.tur, 'kisisel');
assert.strictEqual(v.duzenle, true);
assert.ok(/docs\.google\.com/.test(v.tabloUrl));
assert.strictEqual(Object.keys(t.tablolar).length, 1);
assert.strictEqual(v.siniflar.length, 0);

// 2) Sınıf ve ders ekleme; tekrar eden ad atlanır, sıra korunur
var r = c.veriKaydet(at, null, 'siniflar', { ekle: [{ ad: '9-A' }, { ad: '9-B' }, { ad: ' 9-a ' }, { ad: '' }] });
assert.strictEqual(r.ok, true);
assert.strictEqual(adlar(r.siniflar), J(['9-A', '9-B']));
assert.strictEqual(r.atlanan, 1);
assert.ok(r.uyarilar && /boş olamaz/.test(r.uyarilar[0]));
var s9a = r.siniflar[0].id, s9b = r.siniflar[1].id;
r = c.veriKaydet(at, null, 'dersler', { ekle: [{ ad: 'Matematik' }, { ad: 'Fizik' }] });
var mat = r.dersler[0].id, fiz = r.dersler[1].id;

// 3) Öğretmen + öğrenci + mentör + atama
r = c.veriKaydet(at, null, 'ogretmenler', { ekle: [{ ad: 'Ayşe Demir', brans: 'Matematik', kullanici: 'Ayse.Demir' }, { ad: 'Ali Kaya', brans: 'Fizik' }] });
var ayse = r.ogretmenler.filter(function (x) { return x.ad === 'Ayşe Demir'; })[0];
assert.strictEqual(ayse.kullanici, 'ayse.demir', 'kullanıcı adı küçük harfe çevrilir');
var ali = r.ogretmenler.filter(function (x) { return x.ad === 'Ali Kaya'; })[0];
r = c.veriKaydet(at, null, 'ogrenciler', { ekle: [
  { no: '12', ad: 'Zeynep Ak', sinif: s9a, mentor: ayse.id },
  { no: '3', ad: 'Can Er', sinif: s9a },
  { no: '12', ad: 'Aynı No', sinif: s9b },
  { no: '40', ad: 'Hatalı Sınıf', sinif: 'yok' },
  { no: '7', ad: 'Ece Su', sinif: s9b, mentor: ali.id }
] });
assert.strictEqual(adlar(r.ogrenciler), J(['Can Er', 'Ece Su', 'Zeynep Ak']), 'numaraya göre sıralı; aynı numara ve hatalı sınıf eklenmez');
assert.strictEqual(r.atlanan, 1);
assert.ok(r.uyarilar.some(function (h) { return /Sınıf bulunamadı/.test(h); }));
var zeynep = r.ogrenciler.filter(function (x) { return x.ad === 'Zeynep Ak'; })[0];
var can = r.ogrenciler.filter(function (x) { return x.ad === 'Can Er'; })[0];
r = c.veriKaydet(at, null, 'atamalar', { ekle: [{ ogretmen: ayse.id, ders: mat, sinif: s9a, saat: 6 }, { ogretmen: ayse.id, ders: mat, sinif: s9b, saat: 6 }, { ogretmen: ali.id, ders: fiz, sinif: s9a, saat: 2 }] });
assert.strictEqual(r.atamalar.length, 3);
r = c.veriKaydet(at, null, 'atamalar', { ekle: [{ ogretmen: ayse.id, ders: mat, sinif: s9a, saat: 5 }] });
assert.strictEqual(r.atamalar.length, 3, 'aynı atama ikinci kez eklenmez, saati güncellenir');
assert.strictEqual(r.atamalar.filter(function (a) { return a.sinif === s9a && a.ders === mat; })[0].saat, 5);
assert.ok(c.veriKaydet(at, null, 'atamalar', { ekle: [{ ogretmen: ali.id, ders: fiz, sinif: s9b, saat: 99 }] }).uyarilar[0].indexOf('0 ile 40') > -1);

// 4) Güncelleme: mentör değişir, sınıf adı değişince E-Tablodaki okunabilir sütun da yenilenir
r = c.veriKaydet(at, null, 'ogrenciler', { guncelle: [{ id: can.id, mentor: ali.id }] });
assert.strictEqual(r.ogrenciler.filter(function (x) { return x.id === can.id; })[0].mentor, ali.id);
assert.ok(/numara/.test(c.veriKaydet(at, null, 'ogrenciler', { guncelle: [{ id: can.id, no: '12' }] }).uyarilar[0]));
c.veriKaydet(at, null, 'siniflar', { guncelle: [{ id: s9a, ad: '9-A Fen' }] });
var tablo = JSON.parse(t.tablolar[Object.keys(t.tablolar)[0]]);
var ogrSayfa = tablo.sayfalar.filter(function (s) { return s.ad === 'Öğrenciler'; })[0];
assert.ok(ogrSayfa.h.some(function (row) { return row[2] === 'Zeynep Ak' && row[5] === '9-A Fen' && row[6] === 'Ayşe Demir'; }), J(ogrSayfa.h));
assert.strictEqual(J(ogrSayfa.h[0]), J(['Kimlik', 'No', 'Ad Soyad', 'Sınıf kimliği', 'Mentör kimliği', 'Sınıf (ad)', 'Mentör (ad)']));

// 5) Önbellek silinse de veri E-Tablodan aynen okunur
Object.keys(t.onbellek).forEach(function (k) { delete t.onbellek[k]; });
var v2 = c.veriOku(at);
assert.strictEqual(v2.ogrenciler.length, 3);
assert.strictEqual(v2.atamalar.length, 3);
assert.strictEqual(typeof v2.atamalar[0].saat, 'number');

// 6) Formül gibi başlayan değerler hücreye metin olarak yazılır, okurken geri çevrilir
r = c.veriKaydet(at, null, 'dersler', { ekle: [{ ad: '=HYPERLINK("x")' }] });
assert.ok(r.dersler.some(function (d) { return d.ad === '=HYPERLINK("x")'; }));
tablo = JSON.parse(t.tablolar[Object.keys(t.tablolar)[0]]);
assert.ok(tablo.sayfalar.filter(function (s) { return s.ad === 'Dersler'; })[0].h.some(function (row) { return row[1] === '\'=HYPERLINK("x")'; }));

// 7) Silme: öğretmen silinince mentörlük ve atamaları temizlenir; sınıf silinince öğrenciler sınıfsız kalır
r = c.veriKaydet(at, null, 'ogretmenler', { sil: [ali.id] });
assert.strictEqual(r.atamalar.filter(function (a) { return a.ogretmen === ali.id; }).length, 0);
assert.strictEqual(r.ogrenciler.filter(function (o) { return o.mentor === ali.id; }).length, 0);
r = c.veriKaydet(at, null, 'siniflar', { sil: [s9b] });
assert.strictEqual(r.ogrenciler.filter(function (o) { return o.ad === 'Ece Su'; })[0].sinif, '');
assert.strictEqual(r.atamalar.filter(function (a) { return a.sinif === s9b; }).length, 0);

// 8) Okul kapsamı: yönetici düzenler, öğretmen yalnızca okur, öğrenci giremez, başka okul göremez
var okul = c.adminOkulOlustur(at, 'Fen Lisesi');
var okul2 = c.adminOkulOlustur(at, 'Başka Lise');
var yon = kayit('Müdür Bey', 'mudur', 'mudur@ornek.com', { rol: 'yonetici', okulAdi: 'Fen Lisesi' });
c.adminBasvuruOnayla(at, 'mudur', okul.okul);
var yt = c.girisYap('mudur', 'mudur-sifre-1').token;
var ov = c.veriOku(yt);
assert.strictEqual(ov.kapsam.tur, 'okul');
assert.strictEqual(ov.kapsam.ad, 'Fen Lisesi');
assert.strictEqual(ov.duzenle, true);
assert.strictEqual(ov.siniflar.length, 0, 'okul verisi kişisel veriden ayrı');
assert.strictEqual(J(c.authOturum(yt).paneller), J(['veri', 'okul']));
var os = c.veriKaydet(yt, null, 'siniflar', { ekle: [{ ad: '10-A' }] }).siniflar[0].id;
var od = c.veriKaydet(yt, null, 'dersler', { ekle: [{ ad: 'Türkçe' }] }).dersler[0].id;
var oo = c.veriKaydet(yt, null, 'ogrenciler', { ekle: [{ no: '1', ad: 'Deniz Yıldız', sinif: os }, { no: '2', ad: 'Ege Tan', sinif: os }] }).ogrenciler;
assert.throws(function () { c.veriOku(yt, okul2.okul); }, /erişiminiz yok/);
assert.throws(function () { c.veriOku(yt, 'k:mudur'); }, /Okulunuzun verilerini/);

var ogrt = kayit('Selin Öğretmen', 'selin', 'selin@ornek.com', { rol: 'ogretmen', okulKodu: c.okulPaneli(yt).okul.kod });
var tv = c.veriOku(ogrt.token);
assert.strictEqual(tv.duzenle, false);
assert.strictEqual(tv.tabloUrl, undefined, 'öğretmen E-Tablo adresini görmez');
assert.strictEqual(tv.ogrenciler.length, 2);
assert.strictEqual(J(c.authOturum(ogrt.token).paneller), '[]', 'okuldaki öğretmen Okul verileri panelini görmez');
assert.ok(/yalnızca okul yöneticisi/.test(c.veriKaydet(ogrt.token, null, 'siniflar', { ekle: [{ ad: 'X' }] }).hata));
var ogr = kayit('Öğrenci', 'ogrenci1', 'o@ornek.com', { rol: 'ogrenci', okulKodu: c.okulPaneli(yt).okul.kod });
assert.throws(function () { c.veriOku(ogr.token); }, /öğrencilere açık değil/);

// Admin okul seçebilir ve okul listesini alır
var av = c.veriOku(at, okul.okul);
assert.strictEqual(av.kapsam.ad, 'Fen Lisesi');
assert.strictEqual(av.okullar.length, 2);
assert.strictEqual(av.uyeler.some(function (u) { return u.kullanici === 'selin'; }), true);
assert.strictEqual(av.uyeler.some(function (u) { return u.kullanici === 'ogrenci1'; }), false, 'öğrenciler öğretmen eşleştirme listesine girmez');
assert.strictEqual(c.veriOku(at, 'k:mustafadmrkrn').kapsam.tur, 'kisisel');

// 9) Değerlendirme: araç kapalıysa gönderilemez; açılınca öğretmen gönderir, ikinci not atlanır
c.okulAraclariKaydet(yt, null, { ogretmen: ['nobet'], ogrenci: [] });
assert.throws(function () { c.dgDurum(ogrt.token, null, os, od); }, /açık değil/);
c.okulAraclariKaydet(yt, null, { ogretmen: ['degerlendirme'], ogrenci: [] });
var g = c.dgGonder(ogrt.token, null, { sinif: os, ders: od, notlar: [
  { ogrenci: oo[0].id, metin: 'Derse katılımı çok iyi.' },
  { ogrenci: oo[1].id, metin: '   ' },
  { ogrenci: 'yabanci', metin: 'x' }
] });
assert.strictEqual(J(g.eklenen), J([oo[0].id]));
var d = c.dgDurum(ogrt.token, null, os, od);
assert.strictEqual(J(d.gonderilen), J([oo[0].id]));
assert.ok(/^\d{4}-\d{4} [12]\. Dönem$/.test(d.donem));
g = c.dgGonder(ogrt.token, null, { sinif: os, ders: od, notlar: [{ ogrenci: oo[0].id, metin: 'Tekrar' }, { ogrenci: oo[1].id, metin: 'Ödevlerini düzenli yapıyor.' }] });
assert.strictEqual(J(g.atlanan), J([oo[0].id]));
assert.strictEqual(J(g.eklenen), J([oo[1].id]));

// Öğretmen tüm notları göremez, düzenleyemez; yönetici görür, düzenler, siler
assert.throws(function () { c.dgHepsi(ogrt.token); }, /yalnızca okul yöneticisi/);
assert.throws(function () { c.dgSil(ogrt.token, null, ['x']); }, /yalnızca okul yöneticisi/);
var h = c.dgHepsi(yt);
assert.strictEqual(h.notlar.length, 2);
var n0 = h.notlar.filter(function (n) { return n.ogrenci === oo[0].id; })[0];
assert.strictEqual(n0.ogretmen, 'selin');
assert.strictEqual(n0.ogretmenAd, 'Selin Öğretmen');
assert.strictEqual(n0.sinifAd, '10-A');
assert.strictEqual(n0.dersAd, 'Türkçe');
var du = c.dgDuzenle(yt, null, n0.id, 'Düzeltilmiş not');
assert.strictEqual(du.not.metin, 'Düzeltilmiş not');
assert.ok(du.not.duzenleme);
assert.strictEqual(c.dgSil(yt, null, [n0.id]).silinen, 1);
assert.strictEqual(c.dgHepsi(yt).notlar.length, 1);
assert.strictEqual(c.dgHepsi(at, okul.okul).notlar.length, 1, 'admin okul notlarını görür');

// 10) Dönem hesabı (Türkiye saati)
assert.strictEqual(c.veriZaman(new Date('2026-01-31T20:59:00Z')).donem, '2025-2026 1. Dönem');
assert.strictEqual(c.veriZaman(new Date('2026-01-31T21:00:00Z')).donem, '2025-2026 2. Dönem', 'Türkiye saatiyle 1 Şubat');
assert.strictEqual(c.veriZaman(new Date('2026-08-01T00:00:00Z')).donem, '2026-2027 1. Dönem');
assert.strictEqual(c.veriZaman(new Date('2026-10-29T16:05:00Z')).saat, '19:05');
assert.strictEqual(c.veriZaman(new Date('2026-10-29T16:05:00Z')).gun, 'Perşembe');

console.log('Veri testleri geçti.');
