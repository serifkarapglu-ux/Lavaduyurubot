import express from "express";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

const USERS_FILE = "users.json";
const GROUPS_FILE = "groups.json";
const ADMINS_FILE = "admins.json";

// Dosya yoksa oluştur
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(GROUPS_FILE)) fs.writeFileSync(GROUPS_FILE, "[]");
if (!fs.existsSync(ADMINS_FILE)) fs.writeFileSync(ADMINS_FILE, "[]");

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE));
const loadGroups = () => JSON.parse(fs.readFileSync(GROUPS_FILE));
const loadAdmins = () => JSON.parse(fs.readFileSync(ADMINS_FILE));
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
  const chatType = msg.chat.type;

  // Kullanıcı özelden start derse ID kaydolur
  if (text === "/start" && chatType === "private") {
    let users = loadUsers();
    if (!users.includes(chatId)) {
      users.push(chatId);
      saveUsers(users);
    }
    await axios.post(`${API}/sendMessage`, {
      chat_id: chatId,
      text: "Hoş geldin! Bu bot global duyuru botudur."
    });
  }

  // Bot bir gruba/kanala eklenirse ID kaydolur
  if (chatType === "group" || chatType === "supergroup" || chatType === "channel") {
    let groups = loadGroups();
    if (!groups.includes(chatId)) {
      groups.push(chatId);
      saveGroups(groups);
    }
  }

  // 🔥 GLOBAL DUYURU KOMUTU
  if (text.startsWith("/duyuru")) {

    // Admin kontrolü
    const admins = loadAdmins();
    if (!admins.includes(chatId)) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text: "⛔ Bu komutu kullanma yetkin yok!"
      });
      return res.sendStatus(200);
    }

    // Duyuru mesajı
    const duyuru = text.replace("/duyuru", "").trim();

    if (!duyuru) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text: "📢 Kullanım: /duyuru mesaj"
      });
      return res.sendStatus(200);
    }

    const users = loadUsers();
    const groups = loadGroups();

    // Kişilere gönder
    for (let id of users) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: id,
        text: `📢 *Yeni Duyuru:*\n\n${duyuru}`,
        parse_mode: "Markdown"
      });
    }

    // Gruplara gönder
    for (let id of groups) {
      await axios.post(`${API}/sendMessage`, {
        chat_id: id,
        text: `📢 *Yeni Duyuru:*\n\n${duyuru}`,
        parse_mode: "Markdown"
      });
    }

    // Admin’e bilgi
    await axios.post(`${API}/sendMessage`, {
      chat_id: chatId,
      text: "✔️ Duyuru gönderildi."
    });

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Duyuru Botu Aktif:", port));
