# School Asist (geçici ad)

Öğretmenlerin gündelik işlerini kolaylaştıran Google Apps Script tabanlı araçlar.

İlk araç: **Nöbet Çizelgesi** — öğretmenlerin müsait günlerine ve nöbet yerlerine göre
adil dağılımlı haftalık nöbet çizelgesi üretir.

## Yapı

```
appsscript.json      Apps Script manifest (web uygulaması, Europe/Istanbul)
src/Code.gs          Web uygulaması giriş noktası (doGet)
src/Nobet.gs         Çizelge algoritması (saf fonksiyon, Sheets'e bağımlı değil)
src/index.html       Arayüz (Stitch tasarımı buraya taşınacak)
tests/nobet.test.js  Algoritma testleri (Node ile çalışır)
```

## Testleri çalıştırma

```
node tests/nobet.test.js
```

## Yol haritası

1. Nöbet algoritması (v1 hazır)
2. Veri girişi: öğretmen ve nöbet yeri listelerini Google Sheets'ten okuma
3. Çizelgeyi Sheets'e yazma ve yazdırılabilir çıktı
4. Stitch arayüzünün entegrasyonu
5. Sınav analizi, karne, yıllık plan araçları
