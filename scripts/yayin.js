// GitHub Pages sürümü: docs/index.html bağımsız sayfa olarak üretilir; sunucu işlemleri Apps Script JSON API'sine gider.
// Kullanım: node scripts/yayin.js [api-adresi]
var path = require('path');
var cp = require('child_process');
var fs = require('fs');
var API = process.argv[2] || 'https://script.google.com/macros/s/AKfycbxun3_UR1iNKQziVebfyru7XiWQvuQcfUQGjX10krqHbQe7GhAZsEowOxr_QmQPJIlAuA/exec';
var hedef = path.join(__dirname, '..', 'docs', 'index.html');
cp.execFileSync(process.execPath, [path.join(__dirname, 'preview.js'), hedef, '--api=' + API], { stdio: 'inherit' });
var html = fs.readFileSync(hedef, 'utf8');
if (/<\?/.test(html)) throw new Error('Apps Script şablon işareti kaldı.');
if (/DEMO_SUNUCU = \{/.test(html)) throw new Error('Demo sunucu karışmış.');
if (html.indexOf('window.MDEA_API_URL = ') < 0) throw new Error('API adresi yazılmadı.');
if (/google\.script\.run\.withSuccess/.test(html) === false && html.indexOf('google.script.run') < 0) throw new Error('Beklenmeyen: Apps Script yolu yok.');
console.log('Yayın sayfası hazır: docs/index.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KB)');
