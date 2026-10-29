// Önizleme derleyici. src/index.html içindeki
//   - <?!= include('ad') ?> satırlarını src/ad.html ile,
//   - /*__NOBET__*/, /*__SINAV__*/ ve /*__DENEME__*/ yer tutucularını ilgili .gs dosyalarıyla
// doldurur; böylece sayfa Apps Script olmadan tarayıcıda çalışır.
// Kullanım: node scripts/preview.js [hedef-dosya] [--kurulum]
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
html = html.replace('/*__DENEME__*/', function () { return oku('Deneme.gs'); });

// Demo sunucu: önizlemede giriş, roller ve okul işlemleri gerçek sunucu koduyla tarayıcıda çalışır.
// Apps Script kurulum paketinde (--kurulum) gerçek sunucu kullanıldığı için eklenmez.
var kurulum = process.argv.indexOf('--kurulum') > -1;
html = html.replace('/*__DEMO__*/', function () {
  if (kurulum) return '';
  var shim = oku('demo-sunucu.js');
  var kod = ['Code.gs', 'Auth.gs', 'Roller.gs'].map(oku).join('\n');
  var adlar = [];
  oku('Code.gs').replace(/^function (\w+)\(/gm, function (_, ad) { adlar.push(ad); });
  return '(function () {\n' + shim + '\n' + kod + '\n' +
    'var api = {' + adlar.map(function (a) { return a + ': ' + a; }).join(', ') + '};\n' +
    'function demoCagri(ad, args) {\n' +
    '  if (typeof api[ad] !== "function") return Promise.reject(new Error("Bilinmeyen işlem: " + ad));\n' +
    '  var once = demoPostalar.length;\n' +
    '  var ilkKayit = ad === "kayitOl" && !demoAnahtarlar("sp:kullanici:").length;\n' +
    '  try {\n' +
    '    var r = api[ad].apply(null, JSON.parse(JSON.stringify(args || [])));\n' +
    '    r = r === undefined ? null : JSON.parse(JSON.stringify(r));\n' +
    '    if (ilkKayit && r && r.dogrulama) PropertiesService.getScriptProperties().setProperty("adminler", JSON.stringify([authKullaniciNormal(args[1])]));\n' +
    '    if (demoPostalar.length > once && r && typeof r === "object") {\n' +
    '      var m = /Kod: (\\d{6})/.exec(demoPostalar[demoPostalar.length - 1].body);\n' +
    '      if (m) r.demoKod = m[1];\n' +
    '    }\n' +
    '    return new Promise(function (ok) { setTimeout(function () { ok(r); }, 40); });\n' +
    '  } catch (e) { return Promise.reject(e); }\n' +
    '}\n' +
    'window.DEMO_SUNUCU = { cagir: demoCagri, ilkKayitAdmin: true };\n' +
    '})();';
});

var hedef = process.argv.filter(function (a, i) { return i > 1 && a.indexOf('--') !== 0; })[0] || path.join(kok, 'dist', 'preview.html');
fs.mkdirSync(path.dirname(hedef), { recursive: true });
fs.writeFileSync(hedef, html);
console.log('Yazıldı: ' + hedef);
