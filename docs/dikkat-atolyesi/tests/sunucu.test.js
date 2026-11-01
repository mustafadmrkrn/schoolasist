/* node tests/sunucu.test.js */
const assert = require('assert');
const { sunucuYukle } = require('./taklit');
const s = sunucuYukle();
const q = s.istek;
let n = 0; const t = (ad, fn) => { fn(); n++; console.log('✓', ad); };

t('ping ve doGet', () => { assert.ok(q({ action: 'ping' }).ok); assert.ok(JSON.parse(s.doGet().getContent()).ok); });
t('geçersiz kullanıcı adı / kısa şifre', () => {
  assert.strictEqual(q({ action: 'register', u: 'a', p: '123456' }).hata, 'kullanici_gecersiz');
  assert.strictEqual(q({ action: 'register', u: 'ayse', p: '123' }).hata, 'sifre_kisa');
});
let tok;
t('kayıt', () => { const r = q({ action: 'register', u: 'Ayse.Yilmaz', p: 'gizli123' }); assert.ok(r.ok); assert.strictEqual(r.user, 'ayse.yilmaz'); tok = r.token; });
t('aynı kullanıcı ikinci kez kaydolamaz', () => assert.strictEqual(q({ action: 'register', u: 'ayse.yilmaz', p: 'baska123' }).hata, 'kullanici_var'));
t('şifre düz metin saklanmaz', () => {
  const rows = Object.values(s._tablolar)[0].sheets.Aileler.rows;
  assert.ok(!JSON.stringify(rows).includes('gizli123'));
});
t('yanlış şifre reddedilir, doğru şifre girer', () => {
  assert.strictEqual(q({ action: 'login', u: 'ayse.yilmaz', p: 'yanlis' }).hata, 'hatali_giris');
  const r = q({ action: 'login', u: 'AYSE.YILMAZ', p: 'gizli123' }); assert.ok(r.ok); tok = r.token;
});
t('çocuk ekleme ve yükleme', () => {
  const r = q({ action: 'saveChild', token: tok, child: { id: 'c1abc', name: 'Ali', color: 'mavi', limit: 20, days: { 1: { best: 7, lastCorrect: 7, answers: [0, 1], ts: 100 } }, usage: { '2026-11-01': 300 } } });
  assert.ok(r.ok);
  const l = q({ action: 'load', token: tok }); assert.strictEqual(l.data.children.length, 1); assert.strictEqual(l.data.children[0].name, 'Ali');
});
t('iki cihazdan gelen veri birleşir', () => {
  // cihaz B: eski bir gün 1 denemesi + yeni gün 2 + daha kısa süre
  const r = q({ action: 'saveChild', token: tok, child: { id: 'c1abc', name: 'Ali', color: 'mavi', limit: 20, days: { 1: { best: 3, lastCorrect: 3, ts: 50 }, 2: { best: 9, lastCorrect: 9, ts: 200 } }, usage: { '2026-11-01': 120, '2026-11-02': 60 } } });
  const c = r.child;
  assert.strictEqual(c.days[1].lastCorrect, 7, 'gün 1 en yeni deneme korunur');
  assert.strictEqual(c.days[2].best, 9);
  assert.strictEqual(c.usage['2026-11-01'], 300, 'süre en büyüğü');
  assert.strictEqual(c.usage['2026-11-02'], 60);
  // daha yeni ama düşük skor: en iyi skor korunur
  const r2 = q({ action: 'saveChild', token: tok, child: { id: 'c1abc', days: { 2: { best: 4, lastCorrect: 4, ts: 300 } } } });
  assert.strictEqual(r2.child.days[2].lastCorrect, 4); assert.strictEqual(r2.child.days[2].best, 9);
});
t('başka ailenin verisi görünmez', () => {
  const r = q({ action: 'register', u: 'mehmet', p: 'sifre123' });
  assert.strictEqual(q({ action: 'load', token: r.token }).data.children.length, 0);
});
t('geçersiz oturum', () => assert.strictEqual(q({ action: 'load', token: 'x'.repeat(40) }).hata, 'oturum_yok'));
t('çocuk silme', () => { const r = q({ action: 'deleteChild', token: tok, id: 'c1abc' }); assert.strictEqual(r.data.children.length, 0); });
t('şifre değiştirme', () => {
  assert.strictEqual(q({ action: 'changePassword', token: tok, old: 'yanlis', p: 'yeni1234' }).hata, 'hatali_giris');
  assert.ok(q({ action: 'changePassword', token: tok, old: 'gizli123', p: 'yeni1234' }).ok);
  assert.ok(q({ action: 'login', u: 'ayse.yilmaz', p: 'yeni1234' }).ok);
});
t('çıkış oturumu kapatır', () => { q({ action: 'logout', token: tok }); assert.strictEqual(q({ action: 'load', token: tok }).hata, 'oturum_yok'); });
t('çok fazla hatalı giriş engellenir', () => {
  for (let i = 0; i < 8; i++) q({ action: 'login', u: 'mehmet', p: 'x' });
  assert.strictEqual(q({ action: 'login', u: 'mehmet', p: 'sifre123' }).hata, 'cok_deneme');
});
console.log(`\n${n} test geçti`);
