# MD Education Asist

Öğretmenlerin gündelik işlerini kolaylaştıran, tek sayfalık Google Apps Script web uygulaması.
Araçlar sayfanın üstündeki sekmelerle değişir (`#nobet`, `#sinav`).

- **Nöbet çizelgesi:** öğretmenlerin okulda olduğu günlere göre, aynı gün çakışmadan ve eşit
  dağılımlı haftalık nöbet planı.
- **Sınav analizi:** öğrenci puanlarından sınıf özeti, puan dağılımı, soru güçlüğü,
  ayırt edicilik, kazanım başarısı ve sıralama. Excel'den yapıştırma destekler.

## Yapı

```
appsscript.json        Apps Script manifest (web uygulaması, Europe/Istanbul)
src/Code.gs            Giriş noktası (doGet), include(), sunucu tarafı çağrılar
src/Nobet.gs           Nöbet algoritması (saf fonksiyon)
src/Sinav.gs           Sınav analizi (saf fonksiyon)
src/index.html         Sayfa kabuğu: marka, sekmeler, ortak stil
src/nobet-panel.html   Nöbet paneli (arayüz + betik)
src/sinav-panel.html   Sınav analizi paneli (arayüz + betik)
tests/                 Algoritma testleri (Node ile çalışır)
scripts/preview.js     Parçaları birleştirip tarayıcıda açılabilir önizleme üretir
docs/index.html        Yayınlanan önizleme (GitHub Pages için, preview.js çıktısı)
```

Yeni bir araç eklemek için: `src/<arac>.gs` (hesaplama), `src/<arac>-panel.html` (arayüz),
`index.html` içine bir sekme ve bir `<?!= include('<arac>-panel') ?>` satırı.

## Komutlar

```
node tests/nobet.test.js     # nöbet testleri
node tests/sinav.test.js     # sınav analizi testleri
node scripts/preview.js docs/index.html   # önizlemeyi yeniden derle
```

Önizleme Apps Script olmadan çalışır: hesaplama tarayıcıda yapılır. Apps Script'te aynı
sayfa, hesaplamayı `google.script.run` ile sunucudaki `.gs` dosyalarına yaptırır.

## Yol haritası

1. Nöbet ve sınav analizi (v1 hazır)
2. Nöbette ders arası bazlı çizelge
3. Verileri Google Sheets'ten okuma ve sonuçları Sheets'e yazma
4. Stitch arayüzünün entegrasyonu
5. Karne ve yıllık plan araçları
6. Hesap ve abonelik kontrolü
