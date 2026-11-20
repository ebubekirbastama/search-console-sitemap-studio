# Search Console Sitemap Studio

![Status](https://img.shields.io/badge/status-documentation%20scaffold-orange?style=for-the-badge)
![Repository](https://img.shields.io/badge/repository-public-blue?style=for-the-badge)
![SEO](https://img.shields.io/badge/domain-SEO%20%26%20Sitemaps-0A66C2?style=for-the-badge)

> Google Search Console ve XML sitemap iş akışlarını tek bir çalışma alanında yönetmeyi hedeflediği anlaşılan proje. Uygulamanın gerçek kapsamı, kaynak kodu repository'ye eklendiğinde doğrulanarak bu dokümana işlenecektir.

## 📌 Proje Hakkında

**Search Console Sitemap Studio** repository'si şu anda kaynak kodu içermeyen bir başlangıç deposu görünümündedir. İnceleme sırasında varsayılan `main` dalında boş bir `README.md` dışında uygulama dosyası doğrulanamadı; repository metadata'sında depo boyutu da 0 olarak raporlanıyor.

Bu nedenle aşağıdaki açıklamalar, tamamlanmış özelliklerin beyanı değil, proje adından anlaşılan olası hedef kapsamı ve geliştirme için dokümantasyon iskeletidir. Henüz uygulanmamış özellikler mevcutmuş gibi sunulmamıştır.

## ✨ Hedeflenen Kapsam

Proje adı aşağıdaki alanlara yönelik bir araç fikrine işaret ediyor:

- XML sitemap dosyalarını oluşturma veya inceleme
- Sitemap URL'lerini ve temel XML yapısını doğrulama
- Google Search Console sitemap süreçleriyle çalışma
- Site ve sitemap bilgilerini tek arayüzde takip etme

**Not:** Bu maddeler kaynak koduyla doğrulanmış özellikler değildir. Uygulama kodu eklendiğinde gerçek davranışa göre güncellenecektir.

## 🧰 Teknoloji Kartları

| Teknoloji / Bileşen | Durum | Açıklama |
|---|---|---|
| Uygulama dili | Henüz doğrulanmadı | Repository'de kaynak dosyası bulunamadı |
| Kullanıcı arayüzü | Henüz doğrulanmadı | UI framework'ü belirlenemedi |
| Sitemap / XML | Hedef alan | XML işleme kütüphanesi henüz belirlenemedi |
| Google Search Console API | Hedef alan | API entegrasyonu kaynak kodunda doğrulanmadı |
| Test altyapısı | Henüz doğrulanmadı | Test dosyası bulunamadı |

## 📁 Proje Yapısı

İnceleme sırasında uygulama dizinleri veya kaynak dosyaları bulunamadığından gerçek bir klasör ağacı yayımlanamıyor.

Kaynak kodu eklendiğinde bu bölüm; gerçek dosya ve klasör adları, modüllerin görevleri ve uygulamanın giriş noktasıyla güncellenecektir.

## 🚀 Kurulum

Repository'yi klonlayabilirsiniz:

```bash
git clone https://github.com/ebubekirbastama/search-console-sitemap-studio.git
cd search-console-sitemap-studio
```

> **Şu an için çalıştırılabilir uygulama kurulumu bulunmuyor.** Repository'de doğrulanabilir bir proje manifesti, bağımlılık listesi veya çalıştırma betiği yok. Kaynak kodu ve ilgili yapılandırma dosyaları eklendikten sonra işletim sistemi, runtime, bağımlılıklar ve build komutları bu bölüme yazılmalıdır.

## ▶️ Kullanım

Henüz çalıştırılabilir uygulama kodu bulunmadığından doğrulanmış bir kullanım adımı yoktur.

Uygulama geliştirildiğinde bu bölüm en az şu bilgileri içermelidir:

1. Gerekli runtime ve hesap/erişim koşulları
2. Uygulamanın nasıl başlatılacağı
3. Site veya Search Console property bilgisinin nasıl tanımlanacağı
4. Sitemap'in nasıl oluşturulacağı ya da içeri aktarılacağı
5. Doğrulama sonuçlarının nasıl okunacağı
6. Search Console işlemlerinin nasıl yürütüleceği

## 🔍 Çalışma Akışı

Aşağıdaki akış, proje adının işaret ettiği olası ürün sürecini gösterir; mevcut uygulamanın çalışma biçimi değildir.

```text
Site / Sitemap Bilgisi
        |
        v
Sitemap Hazırlama veya İçeri Aktarma
        |
        v
XML ve URL Doğrulama
        |
        v
Search Console Property
        |
        v
Yetkili API İşlemleri
        |
        v
Sonuçların Görüntülenmesi
```

Google Search Console API kullanımı planlanıyorsa property erişimi OAuth yetkilendirmesi ve uygun API kapsamlarıyla sağlanmalıdır. Sitemap gönderimi, Google'ın sitemap'i tarayacağını veya URL'leri dizine ekleyeceğini garanti etmez.

## ⚠️ Teknik Sınırlamalar

Mevcut repository durumu nedeniyle:

- Uygulama kaynak kodu doğrulanamadı.
- Kullanılan programlama dili ve framework bilinmiyor.
- Çalıştırılabilir giriş noktası veya build sistemi doğrulanamadı.
- Google API entegrasyonu, OAuth akışı ve izin kapsamları doğrulanamadı.
- Sitemap oluşturma, ayrıştırma veya doğrulama davranışı test edilemedi.
- Otomatik test, CI/CD ve dağıtım yapılandırması doğrulanamadı.

Bu README, eksik uygulama kodunu gizlemek veya henüz mevcut olmayan işlevleri varmış gibi göstermek amacı taşımaz.

## 🔐 Güvenli Kullanım

Search Console entegrasyonu eklenecekse aşağıdaki güvenlik ilkeleri uygulanmalıdır:

- Google OAuth erişim belirteçlerini, refresh token'ları veya client secret değerlerini repository'ye commit etmeyin.
- Gizli bilgileri environment variable veya güvenli secret store üzerinden yönetin.
- Yalnızca gerekli en düşük OAuth kapsamlarını talep edin.
- İşlem yapılacak Search Console property'si için kullanıcının yetkisini doğrulayın.
- Sitemap URL'lerini ve XML içeriğini doğrulamadan güvenilir kabul etmeyin.
- Hata günlüklerinde token, kişisel veri veya hassas site bilgilerini yazmayın.
- Sitemap gönderiminin indeksleme garantisi olmadığını kullanıcıya açıkça belirtin.

## 🛠️ Modernizasyon ve Geliştirme Önerileri

Kaynak kodu eklendiğinde değerlendirilebilecek geliştirme başlıkları:

- Sitemap XML parser ve schema/format doğrulaması
- URL normalization ve canonical URL kontrolleri
- Sitemap index ve çoklu sitemap desteği
- Google OAuth 2.0 entegrasyonu
- Search Console property listeleme ve yetki kontrolü
- Sitemap listeleme, gönderme ve durum görüntüleme
- API hata kodları, rate limit ve retry/backoff yönetimi
- Gizli bilgilerin güvenli saklanması
- Birim ve entegrasyon testleri
- CI iş akışı ve sürümleme
- Erişilebilir arayüz ve kullanıcı dostu hata mesajları

## 📄 Lisans

Repository incelemesinde bir `LICENSE` dosyası doğrulanamadı. Projenin lisans koşulları henüz belirtilmemiştir. Kullanım ve dağıtım koşullarının netleşmesi için repository'ye uygun bir lisans dosyası eklenmelidir.

## 👤 Geliştirici

**Ebubekir Bastama**

- GitHub: [@ebubekirbastama](https://github.com/ebubekirbastama)
- Repository: [search-console-sitemap-studio](https://github.com/ebubekirbastama/search-console-sitemap-studio)

---

⭐ Kaynak kodu ve kurulum bilgileri eklendiğinde bu README gerçek uygulama davranışına göre genişletilecektir.
