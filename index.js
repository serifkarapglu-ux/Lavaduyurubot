import express from "express";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Kayıt dosyaları
const USERS_FILE = "users.json";
const GROUPS_FILE = "groups.json";

// Dosyalar yoksa oluştur
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(GROUPS_FILE)) fs.writeFileSync(GROUPS_FILE, "[]");

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE));
const loadGroups = () => JSON.parse(fs.readFileSync(GROUPS_FILE));
const saveUsers = (data) => fs.writeFileSync(USERS_FILE, JSON.stringify(data));
const saveGroups = (data) => fs.writeFileSync(GROUPS_FILE, JSON.stringify(data));

app.get("/", (req, res) => {
  res.send("Duyuru Botu 7/24 Aktif ✔️");
});

app.post("/webhook", async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text || "";

  // Kullanıcı özelden /start derse ID kaydolur
  if (text === "/start") {
    let users = loadUsers();
    if (!users.includes(chatId)) {
      users.push(chatId);
      saveUsers(users);
    }
    await axios.post(`${API}/sendMessage`, {
      chat_id: chatId,
      text: "Hoş geldin! Bu bot duyuru botudur."
    });
  }

  // Bot bir gruba/kanala eklenirse ID kaydolur
  if (msg.chat.type === "group" || msg.chat.type === "supergroup" || msg.chat.type === "channel") {
    let groups = loadGroups();
    if (!groups.includes(chatId)) {
      groups.push(chatId);
      saveGroups(groups);
    }
  }

  // Global Duyuru Komutu
  if (text.startsWith("/duyuru")) {
    const duyuruMesajı = text.replace("/duyuru", "").trim();

    if (!duyuruMesajı) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text: "📢 Kullanım: /duyuru mesaj"
      });
      return res.sendStatus(200);
    }

    // Tüm kullanıcıları yükle
    const users = loadUsers();

    // Tüm grupları yükle
    const groups = loadGroups();

    // Kullanıcılara duyuru gönder
    for (let id of users) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: id,
        text: `📢 *Yeni Duyuru:*\n\n${duyuruMesajı}`,
        parse_mode: "Markdown"
      });
    }

    // Gruplara duyuru gönder
    for (let id of groups) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: id,
        text: `📢 *Yeni Duyuru:*\n\n${duyuruMesajı}`,
        parse_mode: "Markdown"
      });
    }

    await axios.post(`${API}/sendMessage`, {
      chat_id: chatId,
      text: "✔️ Duyuru gönderildi."
    });
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Duyuru Botu Aktif:", port));
