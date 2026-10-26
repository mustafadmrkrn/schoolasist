// Önizleme derleyici. src/index.html içindeki
//   - <?!= include('ad') ?> satırlarını src/ad.html ile,
//   - /*__NOBET__*/ ve /*__SINAV__*/ yer tutucularını Nobet.gs ve Sinav.gs ile
// doldurur; böylece sayfa Apps Script olmadan tarayıcıda çalışır.
// Kullanım: node scripts/preview.js [hedef-dosya]
var fs = require('fs');
var path = require('path');

var kok = path.join(__dirname, '..');
var src = path.join(kok, 'src');
var oku = function (ad) { return fs.readFileSync(path.join(src, ad), 'utf8'); };

var html = oku('index.html');

html = html.replace(/<\?!=\s*include\('([^']+)'\)\s*;?\s*\?>/g, function (_, ad) {
  return oku(ad + '.html');
});
html = html.replace('/*__NOBET__*/', function () { return oku('Nobet.gs'); });
html = html.replace('/*__SINAV__*/', function () { return oku('Sinav.gs'); });

var hedef = process.argv[2] || path.join(kok, 'dist', 'preview.html');
fs.mkdirSync(path.dirname(hedef), { recursive: true });
fs.writeFileSync(hedef, html);
console.log('Yazıldı: ' + hedef);
