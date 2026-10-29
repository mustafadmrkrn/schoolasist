// Apps Script servis taklitleri (testler için). Kullanım:
//   var t = require('./gas-taklit')(['Auth.gs', 'Roller.gs']);  → t.ctx, t.depo, t.postalar, t.sonKod(adres)
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var crypto = require('crypto');

module.exports = function (dosyalar) {
  var imzali = function (b) { return Array.prototype.map.call(b, function (x) { return x > 127 ? x - 256 : x; }); };
  var imzasiz = function (d) { return Buffer.from(d.map(function (x) { return x & 255; })); };
  var depo = {}, onbellek = {}, postalar = [];
  var ctx = {
    console: { log: function () {}, error: function () {} },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      newBlob: function (s) { return { getBytes: function () { return imzali(Buffer.from(String(s), 'utf8')); } }; },
      computeHmacSha256Signature: function (v, k) { return imzali(crypto.createHmac('sha256', imzasiz(k)).update(imzasiz(v)).digest()); },
      computeDigest: function (a, v) { return imzali(crypto.createHash(a).update(String(v)).digest()); },
      base64Encode: function (b) { return imzasiz(b).toString('base64'); },
      base64EncodeWebSafe: function (b) { return imzasiz(b).toString('base64url'); },
      getUuid: function () { return crypto.randomUUID(); },
      formatDate: function (d) { return d.toISOString().slice(0, 10); }
    },
    PropertiesService: { getScriptProperties: function () { return {
      getProperty: function (k) { return Object.prototype.hasOwnProperty.call(depo, k) ? depo[k] : null; },
      setProperty: function (k, v) { depo[k] = String(v); },
      deleteProperty: function (k) { delete depo[k]; },
      getKeys: function () { return Object.keys(depo); }
    }; } },
    CacheService: { getScriptCache: function () { return {
      get: function (k) { return Object.prototype.hasOwnProperty.call(onbellek, k) ? onbellek[k] : null; },
      put: function (k, v) { onbellek[k] = String(v); },
      remove: function (k) { delete onbellek[k]; }
    }; } },
    LockService: { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } },
    MailApp: { getRemainingDailyQuota: function () { return 100; }, sendEmail: function (o) { postalar.push(o); } }
  };
  vm.createContext(ctx);
  var tablolar = {};
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'tablo-taklit.js'), 'utf8'), ctx);
  ctx.SpreadsheetApp = ctx.tabloTaklitKur(
    function (id) { return Object.prototype.hasOwnProperty.call(tablolar, id) ? tablolar[id] : null; },
    function (id, m) { tablolar[id] = m; });
  dosyalar.forEach(function (ad) { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', ad), 'utf8'), ctx); });
  return {
    ctx: ctx, depo: depo, postalar: postalar, tablolar: tablolar, onbellek: onbellek,
    sonKod: function (adres) {
      for (var i = postalar.length - 1; i >= 0; i--) if (!adres || postalar[i].to === adres) return /Kod: (\d{6})/.exec(postalar[i].body)[1];
      return null;
    }
  };
};
