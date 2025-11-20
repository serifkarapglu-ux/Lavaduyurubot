import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

// ---- Webhook doğrulama ----
app.get("/", (req, res) => {
  res.send("Bot çalışıyor 7/24 ✔️");
});

// ---- Telegram Webhook ----
app.post(`/webhook`, async (req, res) => {
  const msg = req.body.message;

  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text || "";

  // /duyuru KOMUTU
  if (text.startsWith("/duyuru")) {
    const duyuruMesajı = text.replace("/duyuru", "").trim();

    if (!duyuruMesajı) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text: "📢 Kullanım: /duyuru mesajın"
      });
    } else {
      await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text: `📢 *Yeni Duyuru:*\n\n${duyuruMesajı}`,
        parse_mode: "Markdown"
      });
    }
  }

  res.sendStatus(200);
});

// ---- PORT AYARI ----
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Bot aktif: ${port}`));
