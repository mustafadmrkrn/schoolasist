// Apps Script kurulum paketi: tüm sunucu kodu tek dosyada (Kod.gs), tüm arayüz tek dosyada (index.html).
// Kullanım: node scripts/kurulum.js   → kurulum/Kod.gs ve kurulum/index.html
// Apps Script projesinde yalnızca bu iki dosya bulunur; başka dosya gerekmez.
var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var kok = path.join(__dirname, '..');
var src = path.join(kok, 'src');
var hedef = path.join(kok, 'kurulum');
fs.mkdirSync(hedef, { recursive: true });

var gs = ['Code.gs', 'Auth.gs', 'Roller.gs', 'Veri.gs', 'Nobet.gs', 'Sinav.gs', 'Deneme.gs'].map(function (ad) {
  return '/* ===================== ' + ad + ' ===================== */\n' + fs.readFileSync(path.join(src, ad), 'utf8');
}).join('\n\n');
var bas = '/**\n * MD Education Asist — Apps Script sunucu kodu (tek dosya).\n' +
  ' * Bu dosya scripts/kurulum.js ile üretilir; düzenlemeleri src/ altında yapın.\n */\n\n';
fs.writeFileSync(path.join(hedef, 'Kod.gs'), bas + gs);

var arayuz = path.join(hedef, 'index.html');
cp.execFileSync(process.execPath, [path.join(__dirname, 'preview.js'), arayuz, '--kurulum'], { stdio: 'inherit' });
var html = fs.readFileSync(arayuz, 'utf8');
if (/<\?/.test(html)) throw new Error('index.html içinde Apps Script şablon işareti kaldı.');
if (/DEMO_SUNUCU = \{/.test(html)) throw new Error('Kurulum paketine demo sunucu karışmış.');

console.log('Yazıldı: kurulum/Kod.gs (' + Math.round(Buffer.byteLength(bas + gs) / 1024) + ' KB), kurulum/index.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KB)');
