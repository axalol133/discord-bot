require('dotenv').config();

const express = require('express');
const app = express();

const { Client, GatewayIntentBits, Events } = require('discord.js');

// 🔥 CAPTURE TOUTES LES ERREURS
process.on('uncaughtException', err => {
    console.error("💥 ERREUR NON CAPTURÉE :", err);
});

process.on('unhandledRejection', err => {
    console.error("💥 PROMISE REJECTED :", err);
});

// 🌐 serveur web
app.get('/', (req, res) => {
    res.send("Bot actif !");
});

app.listen(3000, () => {
    console.log("🌐 Serveur web actif sur le port 3000");
});

// 🤖 bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// 🔍 debug
console.log("TOKEN:", process.env.TOKEN ? "OK" : "PAS OK");

// 🔑 login
console.log("🚀 Avant login");
client.login(process.env.TOKEN)
    .then(() => console.log("🔑 Tentative de connexion..."))
    .catch(err => console.error("❌ ERREUR LOGIN :", err));

console.log("🚀 Après login");
