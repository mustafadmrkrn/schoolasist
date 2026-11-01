/* Kod.gs'i Node'da, Google servislerinin taklitleriyle çalıştırır (test ve yerel deneme için). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');

function sahteServisler() {
  const props = {}, cache = {};
  const tablolar = {};
  function yeniSayfa(ad) {
    const rows = [];
    const sh = {
      ad, rows,
      appendRow: r => rows.push(r.slice()),
      getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
      getRange: (r, c, nr, nc) => ({
        setValues: vals => { for (let i = 0; i < (nr || 1); i++) for (let j = 0; j < (nc || 1); j++) { rows[r - 1 + i][c - 1 + j] = vals[i][j]; } },
        setValue: v => { rows[r - 1][c - 1] = v; }
      }),
      deleteRow: r => rows.splice(r - 1, 1)
    };
    return sh;
  }
  function yeniTablo(id) {
    const sheets = { Sayfa1: yeniSayfa('Sayfa1') };
    return { id, sheets, getId: () => id, getUrl: () => 'https://docs.google.com/' + id,
      getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = yeniSayfa(n)),
      getSheets: () => Object.values(sheets), deleteSheet: s => { delete sheets[s.ad]; } };
  }
  return {
    _tablolar: tablolar, _props: props,
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: { getScriptCache: () => ({ get: k => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: {
      create: () => { const id = 'ss' + Object.keys(tablolar).length; return (tablolar[id] = yeniTablo(id)); },
      openById: id => { if (!tablolar[id]) throw new Error('yok'); return tablolar[id]; }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, s) => [...crypto.createHash('sha256').update(String(s), 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
      base64Encode: bytes => Buffer.from(bytes.map(b => (b + 256) % 256)).toString('base64'),
      getUuid: () => crypto.randomUUID()
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ _t: t, setMimeType() { return this; }, getContent() { return this._t; } }) },
    console
  };
}

function sunucuYukle() {
  const ctx = sahteServisler();
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'sunucu', 'Kod.gs'), 'utf8'), ctx);
  ctx.istek = obj => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).getContent());
  return ctx;
}

/* node tests/taklit.js 8765  → yerel deneme sunucusu (CORS açık) */
if (require.main === module) {
  const http = require('http');
  const s = sunucuYukle();
  const port = +process.argv[2] || 8765;
  http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') { res.end(s.doGet().getContent()); return; }
    let b = ''; req.on('data', d => (b += d)); req.on('end', () => {
      const out = s.doPost({ postData: { contents: b } }).getContent();
      setTimeout(() => res.end(out), 150);
    });
  }).listen(port, () => console.log('taklit sunucu: http://localhost:' + port));
}
module.exports = { sunucuYukle };
