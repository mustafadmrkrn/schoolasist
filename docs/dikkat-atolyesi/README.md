# Dikkat Atölyesi 🧠

🌍 **Diller:** Türkçe · English · Deutsch · Русский (ana sayfadan seçilir; sorular, arayüz ve seslendirme seçilen dilde)

Çocuklar için (3–5+ yaş) **500 dikkat ve beceri alıştırması** içeren, mobil uyumlu web uygulaması.

- **50 gün × 10 sayfa**, 5 zorluk seviyesi (Seviye 1 · 3 yaş → Seviye 5 · 5+ yaş)
- **17 alıştırma türü:** İkizler, Gölgeler, Farklı Olan, Aynısını Bul, Sayalım, Renkler, Büyük–Küçük, Örüntü, Hafıza, Yönler, Gruplar, Çok–Az, Konum, Toplama, Farkları Say, Yarım Resim, Bul Bakalım
- Her sayfanın altında o alıştırmanın çalıştırdığı **beceri simgeleri** (G.A, D.Y.K, K.S.H, AB …) ve yaklaşık süre
- Cevaplar seçim sırasında doğru/yanlış diye gösterilmez; **Bitir**'e basınca skor, doğru–yanlış listesi ve beceri bazında sonuç çıkar
- Sayfa sayfa inceleme (doğru cevap yeşil, yanlış kırmızı)
- **Beceri Karnesi:** tüm günlerdeki becerilere göre başarı yüzdesi
- 🔊 Soruyu sesli okuma (Türkçe)
- İlerleme cihazda (localStorage) saklanır; kurulum, sunucu ya da internet bağlantısı gerekmez

## Çalıştırma
`index.html` dosyasını tarayıcıda açmanız yeterli. GitHub Pages ile yayınlamak için:
Settings → Pages → Branch: `main` / root.

Tüm çizimler kod ile (SVG) üretilir; alıştırmalar sabit bir tohumla oluşturulduğu için her açılışta aynıdır.

## Seslendirme
Okuma bilmeyen çocuklar için her soru açıldığında otomatik olarak Türkçe okunur. Sarı **hoparlör** düğmesine
(ya da maskota, konuşma balonuna) dokununca soru tekrar okunur. Sonuç ekranı da sesli söylenir.
Tablette Türkçe ses yoksa: iPad → Ayarlar › Erişilebilirlik › Seslendirilen İçerik › Sesler › Türkçe;
Android → Ayarlar › Metin okuma (TTS) › Google Konuşma Hizmetleri › Türkçe.

## Aile hesabı (kullanıcı adı + şifre)
- Aile **hesap oluşturur** ya da **giriş yapar**, çocuklarını ekler (ad, renk, karakter, günlük süre sınırı).
- **▶ Çocuğa aç** ile tablet çocuk moduna geçer; uygulama kapatılıp açılsa da çocuk modunda kalır.
- Panele dönmek için üstteki **🔒** düğmesi: ebeveyn kontrolü (iki basamaklı toplama) sorulur.
- **Süre sayacı:** günlük sınır seçilirse ekranın altında geri sayım görünür; son 1 dakikada uyarı, süre bitince
  "Bugünlük süre doldu" ekranı gelir. Ebeveyn +5/+10/+20/+30 dk ekleyebilir. Aile panelinde son 7 günün süreleri görünür.
- İlerleme ve süre **hesapta** saklanır: başka tablet ya da telefondan giriş yapınca aynı ilerleme gelir.
  İnternet yoksa cihazda tutulur, bağlantı gelince gönderilir. İki cihazda oynanırsa veriler birleştirilir.
- **Hesapsız dene:** sunucu gerekmeden, yalnızca o cihazda. Sonradan "Hesap oluştur ve taşı" ile hesaba aktarılır.

## Hesap sunucusu kurulumu (bir kez, ~5 dakika)
Sunucu, `sunucu/Kod.gs` dosyasındaki küçük bir Google Apps Script'tir. Veriler Drive'ınızda otomatik açılan
**"Dikkat Atölyesi Veritabanı"** E-Tablosunda tutulur (şifreler düz metin olarak değil, tuzlanmış özet olarak).

1. script.google.com → **Yeni proje**. Adını "Dikkat Atölyesi Sunucu" yapın.
2. `Kod.gs` içeriğini tamamen silin, bu depodaki `sunucu/Kod.gs` içeriğini yapıştırın, **Kaydet**.
3. Üstteki işlev listesinden **kurulum** seçip **Çalıştır**. İzin isteyecek: hesabınızı seçin →
   **Gelişmiş → (proje)'ye git → İzin ver**. Günlükte "Veritabanı hazır: …" yazar.
4. **Dağıt → Yeni dağıtım → Web uygulaması**. Yürüt: **Ben**, Erişimi olanlar: **Herkes** → **Dağıt**.
5. Verilen **Web uygulaması URL**'sini (…/exec) kopyalayın ve `config.js` içindeki `API: ""` tırnaklarının
   arasına yapıştırın. (İsterseniz bu adresi Claude'a verin, o ekler.)
6. Kodu sonradan güncellerseniz: **Dağıt → Dağıtımları yönet → kalem → Sürüm: Yeni sürüm → Dağıt** (adres değişmez).

Şifresini unutan aile için: Apps Script'te `sifreSifirla` işlevindeki iki değeri değiştirip çalıştırın.

Testler: `node tests/sunucu.test.js` · Yerel deneme sunucusu: `node tests/taklit.js 8765`
