/**
 * Önizleme (demo) için Apps Script servislerinin tarayıcı karşılıkları.
 * scripts/preview.js bu dosyayı sunucu kodu (Code.gs, Auth.gs, Roller.gs) ile birlikte
 * tek bir işlev kapsamına sarar; böylece demo, gerçek uygulamayla aynı giriş ve rol
 * kurallarını çalıştırır. Veriler yalnızca bu tarayıcıda (localStorage) tutulur,
 * e-posta gönderilmez: gönderilecek kod yanıta "demoKod" olarak eklenir.
 * Apps Script kurulum paketine (kurulum/index.html) girmez.
 */
/* __DEMO_SHIM_BASLANGIC__ */
var DEMO_ON = 'mdea_demo2_';
var demoBellek = {};
function demoOku(k) { try { return window.localStorage.getItem(DEMO_ON + k); } catch (e) { return Object.prototype.hasOwnProperty.call(demoBellek, k) ? demoBellek[k] : null; } }
function demoYaz(k, v) { try { window.localStorage.setItem(DEMO_ON + k, v); } catch (e) { demoBellek[k] = v; } }
function demoSil(k) { try { window.localStorage.removeItem(DEMO_ON + k); } catch (e) { delete demoBellek[k]; } }
function demoAnahtarlar(on) {
  var l = [];
  try {
    for (var i = 0; i < window.localStorage.length; i++) {
      var a = window.localStorage.key(i);
      if (a && a.indexOf(DEMO_ON + on) === 0) l.push(a.slice((DEMO_ON + on).length));
    }
  } catch (e) {
    Object.keys(demoBellek).forEach(function (a) { if (a.indexOf(on) === 0) l.push(a.slice(on.length)); });
  }
  return l;
}

/* SHA-256 ve HMAC-SHA256 (eşzamanlı; Apps Script'teki Utilities ile aynı sonuç) */
var DEMO_K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
function demoSha256(b) {
  var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var n = b.length, toplam = ((n + 9 + 63) >> 6) << 6;
  var m = new Uint8Array(toplam);
  for (var i = 0; i < n; i++) m[i] = b[i] & 255;
  m[n] = 0x80;
  var bit = n * 8;
  for (var j = 0; j < 8; j++) m[toplam - 1 - j] = j < 4 ? (bit >>> (8 * j)) & 255 : Math.floor(bit / Math.pow(2, 8 * j)) & 255;
  var w = new Array(64);
  for (var o = 0; o < toplam; o += 64) {
    for (var t = 0; t < 16; t++) w[t] = (m[o + t * 4] << 24) | (m[o + t * 4 + 1] << 16) | (m[o + t * 4 + 2] << 8) | m[o + t * 4 + 3];
    for (t = 16; t < 64; t++) {
      var x = w[t - 15], y = w[t - 2];
      var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    var a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (t = 0; t < 64; t++) {
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ (~e & g);
      var t1 = (hh + S1 + ch + DEMO_K[t] + w[t]) | 0;
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var maj = (a & bb) ^ (a & c) ^ (bb & c);
      var t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + bb) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  var r = [];
  h.forEach(function (v) { r.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); });
  return r;
}
function demoHmac(anahtar, mesaj) {
  var k = anahtar.map(function (x) { return x & 255; });
  if (k.length > 64) k = demoSha256(k);
  while (k.length < 64) k.push(0);
  var ic = k.map(function (x) { return x ^ 0x36; }), dis = k.map(function (x) { return x ^ 0x5c; });
  return demoSha256(dis.concat(demoSha256(ic.concat(mesaj.map(function (x) { return x & 255; })))));
}
function demoImzali(d) { return d.map(function (x) { return x > 127 ? x - 256 : x; }); }
function demoUtf8(s) { return Array.prototype.slice.call(new TextEncoder().encode(String(s))); }
function demoB64(d) {
  var s = '';
  d.forEach(function (x) { s += String.fromCharCode(x & 255); });
  return btoa(s);
}
function demoUuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  var a = new Uint8Array(16);
  window.crypto.getRandomValues(a);
  a[6] = (a[6] & 15) | 64; a[8] = (a[8] & 63) | 128;
  var h = Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

var demoPostalar = [];
var Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  newBlob: function (s) { return { getBytes: function () { return demoImzali(demoUtf8(s)); } }; },
  computeHmacSha256Signature: function (deger, anahtar) { return demoImzali(demoHmac(anahtar, deger)); },
  computeDigest: function (alg, deger) { return demoImzali(demoSha256(demoUtf8(deger))); },
  base64Encode: function (d) { return demoB64(d); },
  base64EncodeWebSafe: function (d) { return demoB64(d).replace(/\+/g, '-').replace(/\//g, '_'); },
  getUuid: demoUuid,
  formatDate: function (d) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
};
var PropertiesService = { getScriptProperties: function () { return {
  getProperty: function (k) { return demoOku('sp:' + k); },
  setProperty: function (k, v) { demoYaz('sp:' + k, String(v)); },
  deleteProperty: function (k) { demoSil('sp:' + k); },
  getKeys: function () { return demoAnahtarlar('sp:'); }
}; } };
var CacheService = { getScriptCache: function () { return {
  get: function (k) {
    var ham = demoOku('cache:' + k);
    if (!ham) return null;
    try { var o = JSON.parse(ham); if (o.bitis > Date.now()) return o.v; } catch (e) {}
    demoSil('cache:' + k);
    return null;
  },
  put: function (k, v, sn) { demoYaz('cache:' + k, JSON.stringify({ v: String(v), bitis: Date.now() + (sn || 600) * 1000 })); },
  remove: function (k) { demoSil('cache:' + k); }
}; } };
var LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };
var MailApp = {
  getRemainingDailyQuota: function () { return 100; },
  sendEmail: function (o) { demoPostalar.push(o); }
};
var Session = { getEffectiveUser: function () { return { getEmail: function () { return 'demo@ornek.com'; } }; } };
var HtmlService = {};
/* __DEMO_SHIM_BITIS__ */
