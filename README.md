# MD Education Asist

Öğretmenlerin gündelik işlerini kolaylaştıran, tek sayfalık Google Apps Script web uygulaması.
Kullanıcı adı ve şifreyle girilir; soldaki menüden istenen araç seçilir.

- **Nöbet çizelgesi:** öğretmenlerin okulda olduğu günlere göre, aynı gün çakışmadan ve eşit
  dağılımlı haftalık nöbet planı.
- **Sınav analizi:** Excel (.xlsx, .xls) veya CSV dosyasından sınıf özeti, puan dağılımı, soru güçlüğü,
  ayırt edicilik, kazanım başarısı ve sıralama. Başlık satırı, ad soyad sütunu, soru sütunları ve
  soru puanları otomatik bulunur, gerekirse elle düzeltilir. Deneme için `ornekler/sinav-ornegi.xlsx`.
- **Mentörlük programı:** mentörlük öğrencileri için haftalık ders / soru çözümü / ders tekrarı programı
  (eski "Mentörlük Ders Programı" sayfasının uygulamaya taşınmış hali). Öğrenci listesi (tek tek ya da
  toplu), program tarihi ve kopyası, ders paleti, tıklayarak ya da sürükleyerek yerleştirme, hücre ve gün
  kopyalama, ayarlanabilir okul saatleri, şablonlar, kurum/mentör adı ve logo, haftalık not, istatistikler,
  geçmiş kayıtlar, yazdır / PDF, CSV, JSON yedek. Veriler kullanıcıya özel olarak tarayıcıda saklanır;
  eski sayfanın yedek dosyaları doğrudan yüklenebilir.
- **Yıllık plan:** derslerin yıllık planları (Word .docx, Excel .xlsx/.xls, CSV) yüklenir; seçili haftanın
  ünite, konu ve kazanımları ders ders gösterilir, ders defterine yapıştırmak için kopyalanır, yıl boyu
  görünümde tüm haftalar listelenir. Başlık satırı ve sütunlar (ay, hafta, saat, ünite/tema, konu,
  kazanım/öğrenme çıktısı, açıklama) otomatik bulunur. Hafta eşleşmesi önce satırdaki tarih aralığından
  ("14-18 Eylül", "14.09.2026-18.09.2026"), yoksa hafta numarasından (2. dönemde 1'den yeniden başlasa da),
  o da yoksa satır sırasından yapılır; öğretim yılı takvimi (varsayılan 2026-2027 MEB: 14 Eylül 2026 –
  25 Haziran 2027, ara tatiller ve yarıyıl) ekrandan değiştirilebilir. Planlar kullanıcıya özel olarak
  tarayıcıda saklanır. Deneme için `ornekler/yillik-plan-ornegi.docx` ve `.xlsx` (uydurma).
- **Deneme analizi:** TYT/AYT, LGS gibi deneme sonuç çizelgeleri (TÜR-SS, TÜR-D, TÜR-Y… sütunları) aynı
  ekrandan yüklenir ve otomatik tanınır. Oturum ve ders bazında ortalama doğru/yanlış/boş/net, başarı
  yüzdesi, yanlış ve boş uyarıları, net sıralaması, varsa TYT/SAY/SÖZ/EA puanları ve sıraları.
  Net = doğru − yanlış / katsayı (YKS 4, LGS 3; ekrandan değiştirilebilir).
  - **Tahmini YKS puanları:** netlerden TYT, SAY, EA, SÖZ (DİL varsa) puanı. ÖSYM kılavuzundaki test
    ağırlıklarıyla 100–500 ölçeğinde ham puan: `katsayı = ağırlık × 400 / soru sayısı`,
    `puan = 100 + Σ katsayı × net` (ör. TYT Türkçe 3,3; AYT Matematik 3,0 puan/net). ÖSYM standart puan
    kullandığı için gerçek puan farklı çıkar; OBP eklenmez. Hesaplanma şartı kılavuzdaki gibi: TYT için
    Türkçe veya Temel Matematikte, alan puanı için ilgili AYT testlerinden birinde en az 0,5 net.
  - **Puan türleri (alan):** her öğrenci için TYT / SAY / EA / SÖZ (/ DİL) kutucukları; birden fazla alan
    seçilebilir, hiçbiri seçilmezse öğrenci yalnızca TYT'ye göre değerlendirilir. Başlangıç seçimi sınıf
    adından (12-TM → EA, MF/FEN → SAY, TS → SÖZ, DİL), yoksa AYT'de cevaplanan testlerden yapılır; tüm sınıf
    için toplu da seçilebilir. Sıralar her puan türünde o türü seçen öğrenciler arasındadır.
  - **Öğrenci analizi:** ders ders D/Y/B/net ve sınıf ortalamasıyla farkı, sınıf ve alan sırası, güçlü yönler,
    puan etkisine göre öncelikli dersler, puanı en çok artıracak testler, öneriler; tek tıkla kopyalanan
    öğrenci raporu. Konu bazında eksik için soru/konu analizi dosyası gerekir (henüz yok).

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
src/mentor-cekirdek.html  Mentörlük programı saf yardımcıları (veri doğrulama, özet, CSV; testli)
src/mentor-panel.html  Mentörlük programı paneli
src/yillik-cekirdek.html  Yıllık plan saf yardımcıları (tablo okuma, takvim, hafta eşleştirme; testli)
src/yillik-panel.html  Yıllık plan paneli
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
node tests/mentor.test.js    # mentörlük programı testleri
node tests/yillik.test.js    # yıllık plan testleri
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
   (klasör olmadan: `Code`, `Auth`, `Nobet`, `Sinav`, `Deneme`, `index`, `mentor-cekirdek`, `mentor-panel`, `yillik-cekirdek`, `yillik-panel`, `giris`, `nobet-panel`, `sinav-panel`).
2. Proje ayarlarında "appsscript.json manifest dosyasını göster"i aç, içeriğini bu depodaki dosyayla değiştir.
3. Dağıt → Yeni dağıtım → Web uygulaması. Yürüt: **Ben**. Erişimi olan kişiler: **Herkes**.
4. İlk açılışta Google izin ister (Script Properties, önbellek, kilit ve **e-posta gönderme**).
   Doğrulama e-postaları uygulamayı dağıtan Google hesabının Gmail'inden, "MD Education Asist" adıyla
   gider. Gönderim kotası günde yaklaşık 100 e-posta (kişisel Gmail) ya da 1500 (Google Workspace);
   kalan kota `MailApp.getRemainingDailyQuota()` ile görülür. Kurulumdan sonra kendi adresinizle bir
   kayıt deneyin; ilk e-postalar gereksiz klasörüne düşebilir.

Kodu GitHub'dan eşitlemek için [clasp](https://github.com/google/clasp) kullanılabilir (`rootDir: src`).

## Giriş sistemi hakkında

- Kayıtta e-posta zorunludur. Adrese 6 haneli kod gider; kod girilmeden oturum açılmaz. Kod 15 dakika
  geçerlidir, 5 yanlış denemede iptal olur ve depoda yalnızca özeti tutulur. Yeniden gönderme 60 saniyede
  bir, kullanıcı başına günde en fazla 10 e-posta. Adres yanlış yazıldıysa doğrulama ekranından düzeltilir.
- Bir e-posta adresi yalnızca doğrulandığında bir hesaba ait sayılır; doğrulanmamış bir kayıt başkasının
  adresini kilitleyemez.
- E-postası olmayan eski hesaplar bir sonraki girişte e-posta ekleyip doğrular; o zamana kadar açık
  oturumları geçersizdir.
- "Şifremi unuttum": kullanıcı adı ya da e-postayla kod istenir, kodla yeni şifre belirlenir; tüm eski
  oturumlar kapanır. Yanıt, hesabın var olup olmadığını belli etmez.
- Önizlemede (demo) e-posta gönderilmez; kod ekranda gösterilir.
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
