const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send("Bot actif !");
});

app.listen(3000, () => {
    console.log("🌐 Serveur web actif sur le port 3000");
});
require('dotenv').config();
const fs = require('fs');
const {
    Client,
    GatewayIntentBits,
    Events,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ===== BASE DE DONNÉES =====
let users = {};
if (fs.existsSync('database.json')) {
    users = JSON.parse(fs.readFileSync('database.json'));
}

function save() {
    fs.writeFileSync('database.json', JSON.stringify(users, null, 2));
}

function getUser(id) {
    if (!users[id]) {
        users[id] = {
            xp: 0,
            level: 0,
            money: 0,
            online: false,
            lastDaily: 0,
            joinDate: Date.now()
        };
    }
    return users[id];
}

// ===== BOT READY =====
console.log("TOKEN:", process.env.TOKEN ? "OK" : "PAS OK");
client.once(Events.ClientReady, () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ===== COMMANDES =====
const commands = [
    new SlashCommandBuilder()
        .setName('title')
        .setDescription('Message important')
        .addStringOption(opt =>
            opt.setName('message')
               .setDescription('Message à envoyer')
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('online')
        .setDescription('Se connecter'),

    new SlashCommandBuilder()
        .setName('offline')
        .setDescription('Se déconnecter'),

    new SlashCommandBuilder()
        .setName('journalier')
        .setDescription('Argent quotidien'),

    new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Voir ton profil ou celui d’un autre joueur')
        .addUserOption(o =>
            o.setName('target')
             .setDescription('Utilisateur à voir')
             .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('admin-add')
        .setDescription('Ajouter argent')
        .addUserOption(o =>
            o.setName('user')
             .setDescription('Utilisateur cible')
             .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName('amount')
             .setDescription('Montant à ajouter')
             .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('admin-remove')
        .setDescription('Retirer argent')
        .addUserOption(o =>
            o.setName('user')
             .setDescription('Utilisateur cible')
             .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName('amount')
             .setDescription('Montant à retirer')
             .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute un utilisateur')
        .addUserOption(o =>
            o.setName('user')
             .setDescription('Utilisateur')
             .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute un utilisateur')
        .addUserOption(o =>
            o.setName('user')
             .setDescription('Utilisateur')
             .setRequired(true)
        )

].map(c => c.toJSON());

// ===== ENREGISTRER COMMANDES =====
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        // 1️⃣ Supprimer toutes les anciennes commandes pour éviter doublons
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, '1482736092535980093'),
            { body: [] }
        );
        console.log("✅ Anciennes commandes supprimées");

        // 2️⃣ Enregistrer les nouvelles commandes
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, '1482736092535980093'),
            { body: commands }
        );
        console.log("✅ Nouvelles commandes enregistrées !");
    } catch (err) {
        console.error(err);
    }
})();

// ===== INTERACTIONS =====
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const user = getUser(interaction.user.id);

    // TITLE
    if (interaction.commandName === 'title') {
        const msg = interaction.options.getString('message');
        await interaction.reply({
            content: `////////// 🚨 IMPORTANT 🚨 \\\\\\\\\\n@everyone\n${interaction.user} dit : ${msg}`
        });
    }

    // ONLINE
    if (interaction.commandName === 'online') {
        if (user.online) return interaction.reply({ content: "❌ Déjà en ligne", ephemeral: true });
        user.online = true;
        save();
        await interaction.reply(`@everyone\n🟢 ${interaction.user} est en ligne !`);
    }

    // OFFLINE
    if (interaction.commandName === 'offline') {
        if (!user.online) return interaction.reply({ content: "❌ Pas en ligne", ephemeral: true });
        user.online = false;
        save();
        await interaction.reply(`🔴 ${interaction.user} est hors ligne.`);
    }

    // PROFIL
    if (interaction.commandName === 'profil') {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const target = getUser(targetUser.id);
        const days = Math.floor((Date.now() - target.joinDate) / 86400000);

        await interaction.reply({
            content:
`📊 PROFIL DE ${targetUser.username}

👤 Nom : ${targetUser.username}
💰 Argent : ${target.money}$
⭐ XP : ${target.xp}
🏆 Niveau : ${target.level}
📅 Ancienneté : ${days} jours
🟢 En ligne : ${target.online ? "Oui" : "Non"}`,
            ephemeral: true
        });
    }

    // JOURNALIER
    if (interaction.commandName === 'journalier') {
        const now = Date.now();
        if (now - user.lastDaily < 86400000) return interaction.reply({ content: "❌ Déjà pris aujourd’hui", ephemeral: true });
        user.lastDaily = now;
        user.money += 10;
        save();
        await interaction.reply(`💰 +10$`);
    }

    // ADMIN ADD
    if (interaction.commandName === 'admin-add') {
        if (!interaction.member.permissions.has("Administrator")) return interaction.reply({ content: "❌ Pas permission", ephemeral: true });
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const t = getUser(target.id);
        t.money += amount;
        save();
        await interaction.reply(`💰 Ajouté à ${target.username}`);
    }

    // ADMIN REMOVE
    if (interaction.commandName === 'admin-remove') {
        if (!interaction.member.permissions.has("Administrator")) return interaction.reply({ content: "❌ Pas permission", ephemeral: true });
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const t = getUser(target.id);
        t.money -= amount;
        save();
        await interaction.reply(`💸 Retiré à ${target.username}`);
    }

    // MUTE
    if (interaction.commandName === 'mute') {
        const target = interaction.options.getMember('user');
        const role = interaction.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) return interaction.reply({ content: "❌ Rôle Muted introuvable", ephemeral: true });
        await target.roles.add(role);
        await interaction.reply(`🔇 ${target.user.username} est muté`);
    }

    // UNMUTE
    if (interaction.commandName === 'unmute') {
        const target = interaction.options.getMember('user');
        const role = interaction.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) return interaction.reply({ content: "❌ Rôle Muted introuvable", ephemeral: true });
        await target.roles.remove(role);
        await interaction.reply(`🔊 ${target.user.username} est unmuté`);
    }
});

// ===== XP AUTOMATIQUE =====
setInterval(() => {
    const now = Date.now();

    for (let id in users) {
        let u = users[id];
        let days = Math.floor((now - u.joinDate) / 86400000);
        let level = Math.floor(days / 10);

        if (level > u.level) {
            u.level = level;
            u.xp = level * 10;
            save();

            const guild = client.guilds.cache.first();
            const member = guild.members.cache.get(id);

            if (member) {
                const channel = guild.channels.cache.first();
                channel.send(`🎉 ${member} est passé niveau ${level} !`);
            }
        }
    }
}, 60000);

client.login(process.env.TOKEN);
