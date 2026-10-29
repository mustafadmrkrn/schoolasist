# Anaokulu Dönem Notları

Site: `docs/yorum/` → https://mustafadmrkrn.github.io/schoolasist/yorum/

Öğretmen akışı (mobil): Şube → Öğrenci → Ders → Öğretmen → Dönem notu (Gönder / Düzenle / Sil).
Not, **Konuşarak yaz** düğmesiyle sesle de yazılabilir (Chrome / Safari, Türkçe; "nokta", "virgül", "yeni satır" komutları).

Gizlilik: Öğretmen yalnızca kendi cihazından yazdığı notu görür. Tüm notları yalnızca yönetici görür.
Yönetici ekranı: sağ üstteki **Yönetici** düğmesi → şifre. Şube / öğretmen / ders / dönem filtresi,
"Kim ne yazdı" özeti, öğrenci × ders durum tablosu, **PDF**: her öğrenci için bir sayfalık rapor ve liste.

## Ortak kayıt için sunucu kurulumu

`ayar.js` içinde `API_URL` boşken site **deneme modunda** çalışır (notlar yalnızca o cihazda).

1. Google Drive'da yeni bir **Google E-Tablo** açın (ör. "Anaokulu Dönem Notları").
2. **Uzantılar → Apps Script**. `Kod.gs` içeriğini silip `yorum/Kod.gs` dosyasının tamamını yapıştırın.
3. `YONETICI_SIFRE` satırına kendi şifrenizi yazın, kaydedin. (Depodaki dosyada şifre yoktur; şifreyi depoya yazmayın.)
4. **Dağıt → Yeni dağıtım → Web uygulaması** — Şu kullanıcı olarak çalıştır: **Ben**, Erişim: **Herkes**.
5. İzinleri onaylayın, **Web uygulaması URL'sini** kopyalayın ve `docs/yorum/ayar.js` içindeki `API_URL` alanına yazın.

Notlar E-Tablodaki **Notlar** sayfasına satır satır yazılır (Dönem, Şube, Öğrenci, Ders, Öğretmen, Not, Tarih, Gün, Saat).
8 hatalı şifre denemesinden sonra yönetici girişi 15 dakika kapanır.
Dönem tarihten otomatik belirlenir: Ağustos–Ocak 1. dönem, Şubat–Temmuz 2. dönem.
