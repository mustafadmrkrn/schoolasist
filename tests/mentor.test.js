// Çalıştırma: node tests/mentor.test.js
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var html = fs.readFileSync(path.join(__dirname, '..', 'src', 'mentor-cekirdek.html'), 'utf8');
var kod = html.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
var ctx = {};
vm.createContext(ctx);
vm.runInContext(kod, ctx);
var J = function (x) { return JSON.stringify(x); };

// 1) Yeni veri
(function () {
  var db = ctx.mentorYeniDb('Ayşe Öğretmen');
  assert.strictEqual(db.courses.length, 10);
  assert.strictEqual(db.courses[0].id, 'c0');
  assert.strictEqual(db.tpls.length, 2);
  assert.strictEqual(db.cfg.mentor, 'Ayşe Öğretmen');
  assert.strictEqual(J(db.cfg.okul), J({ acik: true, bas: 10, bit: 17 }));
})();

// 2) Eski "Mentörlük Ders Programı" yedeği aynen yüklenir
var eski = {
  students: [{ id: 'a1', name: 'Ali Can', cls: '12-A' }, { id: 'b2', name: 'Elif Su', cls: '' }],
  plans: [
    { id: 'p1', sid: 'a1', date: '2026-10-19', start: 8, end: 22, grid: { '0-17': { c: 'c0', m: 1, q: 40 }, '0-18': { c: 'c1', m: 0 }, '5-10': { c: 'c2', m: 2 } }, note: 'Paragraf' },
    { id: 'p2', sid: 'a1', date: '2026-10-26', start: 8, end: 23, grid: { '2-11': { c: 'c0', m: 0 }, '9-99': { c: 'c0', m: 0 } } },
    { id: 'p3', sid: 'yok', date: '2026-10-26', start: 8, end: 23, grid: {} }
  ],
  courses: [{ id: 'c0', name: 'Matematik', color: '#dc2626' }, { id: 'c1', name: 'Fizik', color: '#2563eb' }, { id: 'c2', name: 'Kimya', color: 'kırmızı' }],
  sid: 'a1', pid: 'p1', dark: true, lastBackup: 1761000000000,
  cfg: { org: 'Falcons Robotik', mentor: 'Mustafa Demirkıran', logo: 'javascript:alert(1)' },
  tpls: [{ id: 't1', name: 'Hafta', start: 9, end: 21, grid: { '1-17': { c: 'c0', m: 0 } } }]
};
var db = ctx.mentorDbDuzelt(eski, 'Yeni Ad');
(function () {
  assert.ok(db, 'eski yedek geçerli olmalı');
  assert.strictEqual(db.students.length, 2);
  assert.strictEqual(db.plans.length, 2, 'öğrencisi olmayan program atılır');
  assert.strictEqual(db.plans[0].note, 'Paragraf');
  assert.strictEqual(J(db.plans[0].grid['0-17']), J({ c: 'c0', m: 1, q: 40 }));
  assert.strictEqual(db.plans[1].grid['9-99'], undefined, 'geçersiz hücre atılır');
  assert.strictEqual(db.courses[2].color, '#64748b', 'geçersiz renk düzeltilir');
  assert.strictEqual(db.cfg.org, 'Falcons Robotik');
  assert.strictEqual(db.cfg.mentor, 'Mustafa Demirkıran', 'yedekteki mentör adı korunur');
  assert.strictEqual(db.cfg.logo, '', 'resim olmayan logo kabul edilmez');
  assert.strictEqual(J(db.cfg.okul), J({ acik: true, bas: 10, bit: 17 }), 'eski yedekte okul saatleri varsayılan');
  assert.strictEqual(db.tpls.length, 1);
  assert.strictEqual(db.sid, 'a1');
  assert.strictEqual(db.pid, 'p1');
  assert.strictEqual(db.dark, undefined, 'koyu tema ayarı taşınmaz');
  assert.strictEqual(ctx.mentorDbDuzelt({ foo: 1 }), null);
  assert.strictEqual(ctx.mentorDbDuzelt(null), null);
})();

// 3) Okul saatleri
(function () {
  assert.strictEqual(ctx.mentorOkulMu(db, 0, 10), true);
  assert.strictEqual(ctx.mentorOkulMu(db, 0, 17), false);
  assert.strictEqual(ctx.mentorOkulMu(db, 5, 12), false, 'cumartesi okul yok');
  var k = JSON.parse(JSON.stringify(db));
  k.cfg.okul = { acik: true, bas: 8, bit: 15 };
  assert.strictEqual(ctx.mentorOkulMu(k, 2, 8), true);
  k.cfg.okul.acik = false;
  assert.strictEqual(ctx.mentorOkulMu(k, 2, 12), false);
})();

// 4) Özet: saat, soru, tür, ders
(function () {
  var r = ctx.mentorOzet(db, [db.plans[0]]);
  assert.strictEqual(r.saat, 3);
  assert.strictEqual(r.soru, 40);
  assert.strictEqual(J(r.tur), J([1, 1, 1]));
  assert.strictEqual(r.ders.c0, 1);
  var t = ctx.mentorOzet(db, db.plans);
  assert.strictEqual(t.saat, 3, 'okul saatindeki hücre (Çarşamba 11:00) sayılmaz');
  var k = JSON.parse(JSON.stringify(db));
  k.courses = k.courses.filter(function (c) { return c.id !== 'c1'; });
  assert.strictEqual(ctx.mentorOzet(k, [k.plans[0]]).saat, 2, 'silinmiş ders sayılmaz');
})();

// 5) Gün kopyalama
(function () {
  var k = JSON.parse(JSON.stringify(db));
  var p = k.plans[0];
  p.grid['1-20'] = { c: 'c1', m: 0 };
  ctx.mentorGunKopyala(k, p, 0, 1);
  assert.strictEqual(J(p.grid['1-17']), J({ c: 'c0', m: 1, q: 40 }));
  assert.strictEqual(p.grid['1-20'], undefined, 'hedef günün eski içeriği silinir');
  p.grid['5-12'] = { c: 'c0', m: 0 };
  ctx.mentorGunKopyala(k, p, 5, 2);
  assert.strictEqual(p.grid['2-12'], undefined, 'okul saatine kopyalanmaz');
  assert.strictEqual(J(p.grid['2-10']), undefined, 'okul saati hedefte atlanır');
})();

// 6) Toplu liste ve CSV
(function () {
  var l = ctx.mentorTopluOku('Ayşe Kaya, 11-A\nMehmet Demir;12-B\n\n  Zeynep\tA\nTek İsim');
  assert.strictEqual(J(l), J([{ name: 'Ayşe Kaya', cls: '11-A' }, { name: 'Mehmet Demir', cls: '12-B' }, { name: 'Zeynep', cls: 'A' }, { name: 'Tek İsim', cls: '' }]));
  var rows = ctx.mentorCsvSatirlari(db, db.students[0], db.plans[0]);
  assert.strictEqual(rows[0][0], 'Falcons Robotik - Mentör: Mustafa Demirkıran - Mentörlük Ders Programı');
  assert.strictEqual(rows[3][1], 'Pazartesi');
  var r17 = rows.filter(function (r) { return r[0] === '17:00-18:00'; })[0];
  assert.strictEqual(r17[1], 'Matematik (Soru çözümü: 40)');
  var r10 = rows.filter(function (r) { return r[0] === '10:00-11:00'; })[0];
  assert.strictEqual(r10[1], 'OKUL');
  assert.strictEqual(r10[6], 'Kimya (Ders tekrarı)');
  var csv = ctx.mentorCsv([['a"b', 1], []]);
  assert.strictEqual(csv, '﻿"a""b";"1"\r\n');
})();

console.log('Mentörlük testleri geçti.');
