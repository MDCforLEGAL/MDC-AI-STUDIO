# MDC AI STUDIO

**Modern, Güvenli ve Özel Yapay Zeka Sohbet Arayüzü**

Kendi API anahtarınızı (Bring Your Own Key) kullanarak istediğiniz LLM modelleriyle sohbet edin.

![MDC AI STUDIO](https://img.shields.io/badge/MDC-AI%20STUDIO-blueviolet?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Client-Side](https://img.shields.io/badge/100%25-Client%20Side-orange?style=for-the-badge)

## 🚀 Özellikler

- 🔑 **Bring Your Own Key (BYOK)** — API anahtarlarınız sadece sizin tarayıcınızda kalır
- 🌐 **Çoklu Sağlayıcı Desteği** — OpenAI, Groq, OpenRouter, DeepSeek, xAI, Custom ve daha fazlası
- 🔒 **Maksimum Gizlilik** — Anahtarlar ve sohbet geçmişi sadece `localStorage`'da saklanır. Hiçbir sunucuya gönderilmez
- ⚡ **Streaming Yanıtlar** — Gerçek zamanlı token akışı
- 🎨 **Modern Arayüz** — Karanlık tema, temiz tasarım, mobil uyumlu
- 📝 **Markdown + Kod Vurgulama** 
- 💾 **Sohbet Geçmişi** — Yerel olarak kaydedilir

## 🛡️ Güvenlik

- API anahtarları **asla** herhangi bir sunucuya gönderilmez
- Tüm istekler doğrudan sağlayıcının API'sine gider
- Sohbet verileri sadece sizin cihazınızda tutulur
- Açık kaynak — kodu inceleyebilirsiniz

> **Not:** Bazı sağlayıcılar (OpenAI, Anthropic vb.) tarayıcıdan doğrudan istekleri CORS politikası nedeniyle engelleyebilir. Bu durumda:
> - OpenRouter veya Groq gibi daha esnek sağlayıcıları deneyin
> - Veya kendi basit bir proxy (Vercel/Cloudflare Worker) kullanın

## 💻 Kullanım

1. [GitHub Pages](https://mdcforlegal.github.io/MDC-AI-STUDIO/) adresinden açın veya lokal olarak çalıştırın
2. Sağ üstteki **Ayarlar** ikonuna tıklayın
3. Sağlayıcıyı seçin ve API anahtarınızı yapıştırın
4. Model seçin veya yazın
5. Sohbete başlayın!

## 🔧 Yerel Çalıştırma

Sadece `index.html` dosyasını bir tarayıcıda açmanız yeterlidir. Veya:

```bash
npx serve .
```

## 📝 Desteklenen Sağlayıcılar (OpenAI Uyumlu)

| Sağlayıcı     | Base URL                              | Örnek Model              |
|---------------|---------------------------------------|--------------------------|
| OpenAI        | `https://api.openai.com/v1`           | gpt-4o, gpt-4o-mini      |
| Groq          | `https://api.groq.com/openai/v1`      | llama-3.3-70b-versatile  |
| OpenRouter    | `https://openrouter.ai/api/v1`        | openai/gpt-4o            |
| DeepSeek      | `https://api.deepseek.com`            | deepseek-chat            |
| xAI (Grok)    | `https://api.x.ai/v1`                 | grok-3                   |
| Custom        | İstediğiniz URL                       | -                        |

## 💙 Katkıda Bulunun

Pull request'ler açıktır. Özellik önerileri ve hata bildirimleri için Issue açabilirsiniz.

## 📜 Lisans

MIT License — Özgürce kullanın, değiştirin, dağıtın.

---

**MDC AI STUDIO** • Güç sizin elinizde.
