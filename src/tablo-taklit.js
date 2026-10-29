/**
 * SpreadsheetApp taklidi: Veri.gs'in kullandığı kadarı. Testlerde (bellekte) ve önizlemede (localStorage) kullanılır;
 * Apps Script kurulum paketine girmez.
 *   var SpreadsheetApp = tabloTaklitKur(okuFn, yazFn)  — okuFn(id) → JSON metni | null, yazFn(id, metin)
 */
function tabloTaklitKur(oku, yaz) {
  function yukle(id) { var h = oku(id); return h ? JSON.parse(h) : null; }
  function kaydet(id, d) { yaz(id, JSON.stringify(d)); }

  function Aralik(ss, ad, r, c, nr, nc) { this.ss = ss; this.ad = ad; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  Aralik.prototype._sayfa = function (d) { return d.sayfalar.filter(function (s) { return s.ad === this.ad; }, this)[0]; };
  Aralik.prototype.getValues = function () {
    var s = this._sayfa(yukle(this.ss.id)), sonuc = [];
    for (var i = 0; i < this.nr; i++) {
      var satir = s.h[this.r - 1 + i] || [], r = [];
      for (var j = 0; j < this.nc; j++) { var v = satir[this.c - 1 + j]; r.push(v == null ? '' : v); }
      sonuc.push(r);
    }
    return sonuc;
  };
  Aralik.prototype.getDisplayValues = function () { return this.getValues().map(function (r) { return r.map(String); }); };
  Aralik.prototype.setValues = function (deger) {
    if (deger.length !== this.nr || deger.some(function (r) { return r.length !== this.nc; }, this)) throw new Error('Aralık boyutu uyuşmuyor.');
    var d = yukle(this.ss.id), s = this._sayfa(d);
    for (var i = 0; i < this.nr; i++) {
      var satir = s.h[this.r - 1 + i] || (s.h[this.r - 1 + i] = []);
      for (var j = 0; j < this.nc; j++) satir[this.c - 1 + j] = deger[i][j];
    }
    for (var k = 0; k < s.h.length; k++) if (!s.h[k]) s.h[k] = [];
    kaydet(this.ss.id, d);
    return this;
  };
  Aralik.prototype.clearContent = function () {
    var d = yukle(this.ss.id), s = this._sayfa(d);
    for (var i = 0; i < this.nr; i++) {
      var satir = s.h[this.r - 1 + i];
      if (satir) for (var j = 0; j < this.nc; j++) satir[this.c - 1 + j] = '';
    }
    kaydet(this.ss.id, d);
    return this;
  };
  Aralik.prototype.setNumberFormat = function () { return this; };
  Aralik.prototype.setFontWeight = function () { return this; };
  Aralik.prototype.setBackground = function () { return this; };

  function Sayfa(ss, ad) { this.ss = ss; this.ad = ad; }
  Sayfa.prototype._veri = function () { var ad = this.ad; return yukle(this.ss.id).sayfalar.filter(function (s) { return s.ad === ad; })[0]; };
  Sayfa.prototype.getName = function () { return this.ad; };
  Sayfa.prototype.setName = function (yeni) {
    var d = yukle(this.ss.id), ad = this.ad;
    d.sayfalar.forEach(function (s) { if (s.ad === ad) s.ad = yeni; });
    kaydet(this.ss.id, d);
    this.ad = yeni;
    return this;
  };
  Sayfa.prototype.getLastRow = function () {
    var h = this._veri().h;
    for (var i = h.length - 1; i >= 0; i--) if ((h[i] || []).some(function (x) { return x !== '' && x != null; })) return i + 1;
    return 0;
  };
  Sayfa.prototype.getRange = function (r, c, nr, nc) { return new Aralik(this.ss, this.ad, r, c, nr || 1, nc || 1); };
  Sayfa.prototype.setFrozenRows = function () { return this; };

  function Tablo(id) { this.id = id; }
  Tablo.prototype.getId = function () { return this.id; };
  Tablo.prototype.getUrl = function () { return 'https://docs.google.com/spreadsheets/d/' + this.id + '/edit'; };
  Tablo.prototype.getName = function () { return yukle(this.id).ad; };
  Tablo.prototype.getSheets = function () { var ss = this; return yukle(this.id).sayfalar.map(function (s) { return new Sayfa(ss, s.ad); }); };
  Tablo.prototype.getSheetByName = function (ad) {
    return yukle(this.id).sayfalar.some(function (s) { return s.ad === ad; }) ? new Sayfa(this, ad) : null;
  };
  Tablo.prototype.insertSheet = function (ad) {
    var d = yukle(this.id);
    d.sayfalar.push({ ad: ad, h: [] });
    kaydet(this.id, d);
    return new Sayfa(this, ad);
  };

  return {
    create: function (ad) {
      var id = 'taklit' + Math.random().toString(36).slice(2, 12);
      kaydet(id, { ad: ad, sayfalar: [{ ad: 'Sayfa1', h: [] }] });
      return new Tablo(id);
    },
    openById: function (id) {
      if (!yukle(id)) throw new Error('E-Tablo bulunamadı: ' + id);
      return new Tablo(id);
    }
  };
}
