require('dotenv').config();

const express = require('express');
const app = express();

const { Client, GatewayIntentBits, Events } = require('discord.js');

// 🌐 Serveur web (Render)
app.get('/', (req, res) => {
    res.send("Bot actif !");
});

app.listen(3000, () => {
    console.log("🌐 Serveur web actif sur le port 3000");
});

// 🤖 Bot Discord
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ✅ Quand le bot est prêt
client.once(Events.ClientReady, () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// 🔍 Debug TOKEN
console.log("TOKEN:", process.env.TOKEN ? "OK" : "PAS OK");

// 🔑 Connexion
client.login(process.env.TOKEN)
    .then(() => console.log("🔑 Tentative de connexion..."))
    .catch(err => console.error("❌ ERREUR LOGIN :", err));
