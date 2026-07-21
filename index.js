const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const STAFF_ROLE = "צוות";
const LUCK_ROLE = "מזל";
const COST = 1000;

let points = {};

if (fs.existsSync("points.json")) {
  points = JSON.parse(fs.readFileSync("points.json"));
}

function save() {
  fs.writeFileSync("points.json", JSON.stringify(points, null, 2));
}

const commands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("בדיקת נקודות"),

  new SlashCommandBuilder()
    .setName("addpoints")
    .setDescription("הוספת נקודות")
    .addUserOption(o =>
      o.setName("user")
      .setDescription("משתמש")
      .setRequired(true))
    .addIntegerOption(o =>
      o.setName("amount")
      .setDescription("כמות")
      .setRequired(true))
].map(c => c.toJSON());


client.once("ready", async () => {
  console.log("הבוט מחובר!");

  const rest = new REST({version:"10"}).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );
});


client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "balance") {
      let p = points[interaction.user.id] || 0;

      return interaction.reply({
        content:`💎 יש לך ${p} נקודות`,
        ephemeral:true
      });
    }


    if (interaction.commandName === "addpoints") {

      if (!interaction.member.roles.cache.some(r=>r.name===STAFF_ROLE)) {
        return interaction.reply({
          content:"❌ אין לך הרשאה",
          ephemeral:true
        });
      }

      let user = interaction.options.getUser("user");
      let amount = interaction.options.getInteger("amount");

      points[user.id] = (points[user.id] || 0) + amount;

      save();

      return interaction.reply(
        `✅ נוספו ${amount} נקודות ל-${user}`
      );
    }
  }


  if (interaction.isButton()) {

    if(interaction.customId !== "spin") return;

    let user = interaction.user;

    if((points[user.id] || 0) < COST) {
      return interaction.reply({
        content:"❌ אין לך מספיק נקודות",
        ephemeral:true
      });
    }

    points[user.id] -= COST;

    let prizes = [
      "🍀 מזל",
      "🔄 סובב שוב",
      "💎 500 נקודות",
      "😭 כלום"
    ];

    let prize = prizes[Math.floor(Math.random()*prizes.length)];

    if(prize === "🔄 סובב שוב")
      points[user.id] += COST;

    if(prize === "💎 500 נקודות")
      points[user.id] += 500;

    save();

    let embed = new EmbedBuilder()
      .setTitle("🎡 גלגל המזל")
      .setDescription(`${user} קיבל:\n\n${prize}`);

    return interaction.reply({
      embeds:[embed]
    });
  }

});


client.login(TOKEN);
