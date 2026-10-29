// Çalıştırma: node tests/roller.test.js
var assert = require('assert');
var t = require('./gas-taklit')(['Auth.gs', 'Roller.gs', 'Code.gs']);
var c = t.ctx;
var J = function (x) { return JSON.stringify(x); };
var TUM = J(['nobet', 'sinav', 'mentor', 'yillik']);

function kayit(ad, k, e, rolBilgi) {
  var r = c.authKayitOl(ad, k, e, k + '-sifre-1', rolBilgi);
  if (!r.dogrulama) return r;
  return c.authEpostaDogrula(r.bilet, t.sonKod(e));
}

// 1) Admin: sabit listedeki hesap her şeyi görür, paneller okul yoksa yalnızca admin
var admin = kayit('Mustafa Demirkıran', 'mustafadmrkrn', 'm@ornek.com');
assert.strictEqual(admin.ok, true, J(admin));
assert.strictEqual(admin.rol, 'admin');
assert.strictEqual(J(admin.araclar), TUM);
assert.strictEqual(J(admin.paneller), J(['admin']));
var at = admin.token;

// 2) Okul yöneticisi başvurusu: onaylanana kadar öğretmen, okulsuz öğretmen tüm araçları görür
assert.ok(/Okulun adını/.test(c.authKayitOl('Y', 'yonetici1', 'y@ornek.com', 'yonetici1-sifre', { rol: 'yonetici' }).hata));
var y = kayit('Ayşe Müdür', 'ayse.mudur', 'ayse@ornek.com', { rol: 'yonetici', okulAdi: '  Atatürk   Anadolu Lisesi ' });
assert.strictEqual(y.rol, 'ogretmen');
assert.strictEqual(y.basvuru.okulAdi, 'Atatürk Anadolu Lisesi');
assert.strictEqual(J(y.araclar), TUM);
assert.strictEqual(J(y.paneller), '[]');
assert.throws(function () { c.adminPaneli(y.token); }, /admin yetkisi/);

// 3) Admin paneli başvuruyu görür ve onaylar → okul açılır, kullanıcı yönetici olur
var ap = c.adminPaneli(at);
var bas = ap.kullanicilar.filter(function (x) { return x.basvuru; });
assert.strictEqual(bas.length, 1);
assert.strictEqual(bas[0].kullanici, 'ayse.mudur');
assert.strictEqual(ap.kullanicilar.filter(function (x) { return x.kullanici === 'mustafadmrkrn'; })[0].sabitAdmin, true);
assert.strictEqual(c.adminBasvuruOnayla(at, 'ayse.mudur').ok, true);
var yo = c.authOturum(y.token);
assert.strictEqual(yo.rol, 'yonetici');
assert.strictEqual(yo.okul.ad, 'Atatürk Anadolu Lisesi');
assert.strictEqual(J(yo.paneller), J(['okul']));
var okulId = yo.okul.id;
var op = c.okulPaneli(y.token);
var kod = op.okul.kod;
assert.ok(/^[A-HJ-NP-Z2-9]{6}$/.test(kod), 'okul kodu 6 karakter, karışan harfler yok: ' + kod);
assert.strictEqual(J(op.okul.araclar.ogretmen), TUM, 'öğretmenler başta tüm araçları görür');
assert.strictEqual(J(op.okul.araclar.ogrenci), '[]', 'öğrenciler başta hiçbirini görmez');

// 4) Öğretmen ve öğrenci okul koduyla kayıt olur; öğrenci kodsuz kayıt olamaz; yanlış kod reddedilir
assert.ok(/okul kodu gerekli/.test(c.authKayitOl('Ö', 'ogr0', 'o0@ornek.com', 'ogr0-sifre-1', { rol: 'ogrenci' }).hata));
assert.ok(/bulunamadı/.test(c.authKayitOl('Ö', 'ogr0', 'o0@ornek.com', 'ogr0-sifre-1', { rol: 'ogrenci', okulKodu: 'ZZZZZZ' }).hata));
assert.strictEqual(t.depo['kullanici:ogr0'], undefined);
var og = kayit('Ali Öğretmen', 'ali.ogretmen', 'ali@ornek.com', { rol: 'ogretmen', okulKodu: kod.toLowerCase().slice(0, 3) + '-' + kod.slice(3) });
assert.strictEqual(og.rol, 'ogretmen');
assert.strictEqual(og.okul.id, okulId, 'kod küçük harf ve tireyle de kabul edilir');
var ogr = kayit('Zeynep Öğrenci', 'zeynep.ogr', 'zeynep@ornek.com', { rol: 'ogrenci', okulKodu: kod });
assert.strictEqual(ogr.rol, 'ogrenci');
assert.strictEqual(J(ogr.araclar), '[]');

// 5) Yönetici araçları seçer: öğretmen ve öğrenci menüsü değişir, sunucu çağrısı da izne bağlı
var kay = c.okulAraclariKaydet(y.token, null, { ogretmen: ['sinav', 'yillik', 'yok', 'sinav'], ogrenci: ['mentor'] });
assert.strictEqual(J(kay.araclar), J({ ogretmen: ['sinav', 'yillik'], ogrenci: ['mentor'] }), 'geçersiz ve tekrar eden araçlar atılır');
assert.strictEqual(J(c.authOturum(og.token).araclar), J(['sinav', 'yillik']));
assert.strictEqual(J(c.authOturum(ogr.token).araclar), J(['mentor']));
assert.strictEqual(J(c.authOturum(y.token).araclar), TUM, 'yönetici her şeyi görür');
assert.throws(function () { c.cizelgeUret(og.token, {}); }, /hesabınıza açık değil/);
assert.throws(function () { c.okulAraclariKaydet(og.token, okulId, {}); }, /yetkiniz yok/, 'öğretmen araç seçemez');
assert.throws(function () { c.okulPaneli(ogr.token); }, /yetkiniz yok/);

// 6) Okul paneli üyeleri listeler (e-posta maskeli); yönetici öğretmeni çıkarabilir, kendini çıkaramaz
var uyeler = c.okulPaneli(y.token).uyeler;
assert.strictEqual(uyeler.length, 3);
assert.ok(uyeler.every(function (x) { return /\*\*\*|\*@/.test(x.eposta); }), 'yönetici e-postaları maskeli görür');
assert.strictEqual(c.okuldanCikar(y.token, null, 'ayse.mudur').ok, false);
assert.strictEqual(c.okuldanCikar(y.token, null, 'ali.ogretmen').ok, true);
var ali = c.authOturum(og.token);
assert.strictEqual(ali.okul, null);
assert.strictEqual(J(ali.araclar), TUM, 'okulsuz öğretmen tüm araçları görür');

// 7) Okula katılma ve kod yenileme: eski kod geçersiz olur
var yeniKod = c.okulKoduYenile(y.token).kod;
assert.notStrictEqual(yeniKod, kod);
assert.strictEqual(c.okulaKatil(og.token, kod).ok, false, 'eski kod çalışmaz');
var kat = c.okulaKatil(og.token, yeniKod);
assert.strictEqual(kat.ok, true);
assert.strictEqual(J(kat.bilgi.araclar), J(['sinav', 'yillik']));
assert.strictEqual(c.okulaKatil(og.token, yeniKod).ok, false, 'iki kez katılamaz');

// 8) Başka okulun yöneticisi bu okulu yönetemez
var y2 = kayit('Mehmet Müdür', 'mehmet.mudur', 'mehmet@ornek.com', { rol: 'yonetici', okulAdi: 'Cumhuriyet Ortaokulu' });
c.adminBasvuruOnayla(at, 'mehmet.mudur');
assert.throws(function () { c.okulPaneli(y2.token, okulId); }, /yetkiniz yok/);
assert.throws(function () { c.okulAraclariKaydet(y2.token, okulId, { ogretmen: [] }); }, /yetkiniz yok/);
assert.throws(function () { c.okuldanCikar(y2.token, okulId, 'zeynep.ogr'); }, /yetkiniz yok/);

// 9) Admin rol ve okul değiştirir; başka admin atar; sabit admin ve kendi yetkisi korunur
assert.strictEqual(c.adminKullaniciGuncelle(at, 'mustafadmrkrn', { rol: 'ogretmen' }).ok, false);
assert.ok(/okul seçin/.test(c.adminKullaniciGuncelle(at, 'ali.ogretmen', { rol: 'yonetici', okul: '' }).hata));
assert.strictEqual(c.adminKullaniciGuncelle(at, 'ali.ogretmen', { rol: 'yonetici', okul: okulId }).ok, true);
assert.strictEqual(c.authOturum(og.token).rol, 'yonetici');
assert.strictEqual(c.adminKullaniciGuncelle(at, 'zeynep.ogr', { rol: 'admin' }).ok, true);
assert.strictEqual(c.authOturum(ogr.token).rol, 'admin');
assert.strictEqual(J(c.authOturum(ogr.token).paneller), J(['okul', 'admin']), 'okulu olan admin okul panelini de görür');
var zt = ogr.token;
assert.strictEqual(c.adminKullaniciGuncelle(zt, 'zeynep.ogr', { rol: 'ogrenci' }).ok, false, 'kendi admin yetkisini kaldıramaz');
assert.strictEqual(c.adminKullaniciGuncelle(at, 'zeynep.ogr', { rol: 'ogrenci' }).ok, true);
assert.strictEqual(c.authOturum(ogr.token).rol, 'ogrenci');
assert.strictEqual(JSON.parse(t.depo.adminler).length, 0);

// 10) Reddedilen başvuru, admin okul açma, admin paneli okul özeti
var y3 = kayit('Can Aday', 'can.aday', 'can@ornek.com', { rol: 'yonetici', okulAdi: 'Deneme Koleji' });
assert.strictEqual(c.adminBasvuruReddet(at, 'can.aday').ok, true);
assert.strictEqual(c.authOturum(y3.token).basvuru, null);
assert.strictEqual(c.authOturum(y3.token).rol, 'ogretmen');
var yeni = c.adminOkulOlustur(at, 'Fen Lisesi');
assert.strictEqual(yeni.ok, true);
assert.strictEqual(c.adminOkulOlustur(at, 'ab').ok, false);
var ozet = c.adminPaneli(at);
assert.strictEqual(ozet.okullar.length, 3);
var ata = ozet.okullar.filter(function (o) { return o.id === okulId; })[0];
assert.strictEqual(ata.uyeSayisi, 3);
assert.strictEqual(J(ata.yoneticiler.sort()), J(['Ali Öğretmen', 'Ayşe Müdür']));
assert.ok(ozet.kullanicilar.some(function (x) { return x.eposta === 'ayse@ornek.com'; }), 'admin tam e-postayı görür');

// 11) Var olan okula yönetici başvurusu onayı; eski (rolsüz) hesap öğretmen sayılır
var y4 = kayit('Deniz Yardımcı', 'deniz.y', 'deniz@ornek.com', { rol: 'yonetici', okulAdi: 'Atatürk Anadolu' });
c.adminBasvuruOnayla(at, 'deniz.y', okulId);
assert.strictEqual(c.authOturum(y4.token).okul.id, okulId, 'mevcut okula atanabilir');
assert.strictEqual(c.adminPaneli(at).okullar.length, 3, 'yeni okul açılmadı');
var eski = JSON.parse(t.depo['kullanici:can.aday']);
delete eski.rol;
t.depo['kullanici:can.aday'] = JSON.stringify(eski);
assert.strictEqual(c.authOturum(y3.token).rol, 'ogretmen');
assert.throws(function () { c.okulPaneli('a'.repeat(64)); }, /Oturum geçersiz/);

console.log('Rol testleri geçti.');
