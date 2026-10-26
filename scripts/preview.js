// Önizleme derleyici: src/index.html içindeki algoritma yer tutucusunu
// src/Nobet.gs ile doldurur, böylece sayfa Apps Script olmadan tarayıcıda çalışır.
// Kullanım: node scripts/preview.js [hedef-dosya]
var fs = require('fs');
var path = require('path');

var kok = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(kok, 'src', 'index.html'), 'utf8');
var gs = fs.readFileSync(path.join(kok, 'src', 'Nobet.gs'), 'utf8');

var cikti = html.replace('/*__NOBET__*/', function () { return gs; });
var hedef = process.argv[2] || path.join(kok, 'dist', 'preview.html');

fs.mkdirSync(path.dirname(hedef), { recursive: true });
fs.writeFileSync(hedef, cikti);
console.log('Yazıldı: ' + hedef);
