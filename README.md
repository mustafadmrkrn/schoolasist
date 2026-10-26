# MD Education Asist

Öğretmenlerin gündelik işlerini kolaylaştıran, tek sayfalık Google Apps Script web uygulaması.
Kullanıcı adı ve şifreyle girilir; soldaki menüden istenen araç seçilir.

- **Nöbet çizelgesi:** öğretmenlerin okulda olduğu günlere göre, aynı gün çakışmadan ve eşit
  dağılımlı haftalık nöbet planı.
- **Sınav analizi:** Excel (.xlsx, .xls) veya CSV dosyasından sınıf özeti, puan dağılımı, soru güçlüğü,
  ayırt edicilik, kazanım başarısı ve sıralama. Başlık satırı, ad soyad sütunu, soru sütunları ve
  soru puanları otomatik bulunur, gerekirse elle düzeltilir. Deneme için `ornekler/sinav-ornegi.xlsx`.
- **Deneme analizi:** TYT/AYT, LGS gibi deneme sonuç çizelgeleri (TÜR-SS, TÜR-D, TÜR-Y… sütunları) aynı
  ekrandan yüklenir ve otomatik tanınır. Oturum ve ders bazında ortalama doğru/yanlış/boş/net, başarı
  yüzdesi, yanlış ve boş uyarıları, net sıralaması, varsa TYT/SAY/SÖZ/EA puanları ve sıraları.
  Net = doğru − yanlış / katsayı (YKS 4, LGS 3; ekrandan değiştirilebilir).

## Yapı

```
appsscript.json        Apps Script manifest (web uygulaması, Europe/Istanbul, erişim: herkes)
src/Code.gs            Giriş noktası (doGet), include(), sunucu tarafı çağrılar
src/Auth.gs            Kayıt, giriş, oturum, çıkış, hatalı deneme kilidi
src/Nobet.gs           Nöbet algoritması (saf fonksiyon)
src/Sinav.gs           Sınav analizi (saf fonksiyon)
src/Deneme.gs          Deneme (TYT/AYT, LGS) sütun algılama ve net analizi (saf fonksiyon)
src/index.html         Sayfa kabuğu: mavi-beyaz tema, sol menü, ortak betikler
src/giris.html         Giriş ve kayıt ekranı (Apps Script veya yerel demo arka ucu)
src/nobet-panel.html   Nöbet paneli
src/sinav-panel.html   Sınav analizi paneli (Excel okuma, sütun eşleştirme, sonuçlar)
tests/                 Algoritma ve giriş testleri (Node ile çalışır)
scripts/preview.js     Parçaları birleştirip tarayıcıda açılabilir önizleme üretir
docs/index.html        Yayınlanan önizleme (GitHub Pages için, preview.js çıktısı)
ornekler/              Deneme için örnek Excel dosyası
```

Yeni bir araç eklemek için: `src/<arac>.gs` (hesaplama), `src/<arac>-panel.html` (arayüz),
`index.html` içine bir menü düğmesi ve bir `<?!= include('<arac>-panel') ?>` satırı.

## Komutlar

```
node tests/nobet.test.js     # nöbet testleri
node tests/sinav.test.js     # sınav analizi testleri
node tests/deneme.test.js    # deneme analizi testleri
node tests/auth.test.js      # giriş testleri (Apps Script servisleri taklit edilir)
node scripts/preview.js docs/index.html   # önizlemeyi yeniden derle
```

## İki çalışma biçimi

| | Önizleme (`docs/index.html`) | Apps Script web uygulaması |
|---|---|---|
| Hesaplama | Tarayıcıda | Sunucuda (`.gs` dosyaları) |
| Hesaplar | **Demo:** yalnızca o tarayıcıda, başka cihazda görünmez | Gerçek: Script Properties'te, her cihazdan |
| Excel okuma | Tarayıcıda | Tarayıcıda (veri analiz için sunucuya gider) |

Önizlemedeki giriş yalnızca gösterim içindir ve gerçek güvenlik sağlamaz.

## Apps Script'e kurulum

1. script.google.com'da yeni proje aç, `src/` altındaki tüm `.gs` ve `.html` dosyalarını aynı adlarla ekle
   (klasör olmadan: `Code`, `Auth`, `Nobet`, `Sinav`, `Deneme`, `index`, `giris`, `nobet-panel`, `sinav-panel`).
2. Proje ayarlarında "appsscript.json manifest dosyasını göster"i aç, içeriğini bu depodaki dosyayla değiştir.
3. Dağıt → Yeni dağıtım → Web uygulaması. Yürüt: **Ben**. Erişimi olan kişiler: **Herkes**.
4. İlk açılışta Google izin ister (Script Properties, önbellek ve kilit hizmetleri).

Kodu GitHub'dan eşitlemek için [clasp](https://github.com/google/clasp) kullanılabilir (`rootDir: src`).

## Giriş sistemi hakkında

- Şifreler düz metin saklanmaz: kullanıcıya özel tuz ve tekrarlı HMAC-SHA256 ile özetlenir.
  Apps Script'te PBKDF2/bcrypt yoktur, bu yüzden tekrar sayısı sınırlıdır (`AUTH_TUR`).
- Oturum belirteci sunucuda yalnızca özet olarak tutulur; süre 7 gündür.
- Aynı kullanıcı adına 5 hatalı denemeden sonra 5 dakika giriş engellenir.
- Script Properties yaklaşık 500 KB ile sınırlıdır. Birkaç bin kullanıcıdan sonra hesapları Sheets'e
  ya da Firebase Auth / Supabase gibi bir kimlik hizmetine taşıyın.
- Öğrenci adı ve notları kişisel veridir. Apps Script sürümünde analiz için sunucu işlevine gönderilir
  ama saklanmaz. Okulda kullanmadan önce okul/kurum veri politikasına bakın.

## Yol haritası

1. Nöbet, sınav analizi, giriş ve sol menü (hazır)
2. Nöbette ders arası bazlı çizelge
3. Kullanıcıya özel veri kaydı (öğretmen listesi, nöbet yerleri, geçmiş analizler)
4. Stitch arayüzünün entegrasyonu
5. Karne ve yıllık plan araçları
6. Abonelik ve araç bazlı erişim kontrolü
