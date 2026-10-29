# Anaokulu Öğrenci Yorumları

Site: `docs/yorum/` → https://mustafadmrkrn.github.io/schoolasist/yorum/

Öğretmen akışı (mobil): Şube → Öğrenci → Ders → Öğretmen → Yorum (Gönder / Düzenle / Sil).
Yönetici ekranı: sağ üstteki **Yönetici** düğmesi. Tüm yorumlar; tarih, gün ve saatle birlikte;
şube / öğretmen / ders / tarih aralığı / kelime filtresi; "Kim ne yazdı" özeti; öğrenci × ders durum tablosu;
**Excel indir** (Tüm Yorumlar, her sınıf ayrı sayfa, Öğretmen Özeti, Öğrenci Durumu).

## Ortak kayıt için sunucu kurulumu (5 dakika)

`ayar.js` içinde `API_URL` boşken site **deneme modunda** çalışır (yorumlar yalnızca o cihazda, şifre 1234).
Herkesin yorumlarının sizde toplanması için:

1. Google Drive'da yeni bir **Google E-Tablo** açın (ör. "Anaokulu Yorumları").
2. **Uzantılar → Apps Script**. `Kod.gs` içeriğini silip `yorum/Kod.gs` dosyasının tamamını yapıştırın.
3. En üstteki `YONETICI_SIFRE = '1234'` değerini kendi şifrenizle değiştirin, kaydedin.
4. **Dağıt → Yeni dağıtım → Web uygulaması**
   - Şu kullanıcı olarak çalıştır: **Ben**
   - Erişimi olan kullanıcılar: **Herkes**
5. İzinleri onaylayın, verilen **Web uygulaması URL'sini** (`https://script.google.com/macros/s/.../exec`) kopyalayın.
6. `docs/yorum/ayar.js` dosyasında `API_URL: ''` alanına bu URL'yi yazın ve kaydedin (commit).

Yorumlar E-Tablodaki **Yorumlar** sayfasına da satır satır yazılır (Şube, Öğrenci, Ders, Öğretmen, Yorum, Tarih, Gün, Saat, Son Düzenleme).

## Notlar
- Öğretmen kendi yorumunu yazdığı cihazdan düzenleyip silebilir; yönetici hepsini düzenleyip silebilir.
- Yarım kalan yorum taslak olarak cihazda saklanır.
- Gönderdikten sonra "Sıradaki öğrenci" ile aynı ders/öğretmenle sınıfta hızlıca ilerlenir.
- Öğrenci veya öğretmen listesini değiştirmek için `docs/yorum/index.html` içindeki `OGRENCILER` ve `DERSLER` bölümlerini düzenleyin.
