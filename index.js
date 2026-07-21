const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const COST = 1000;

const WHEEL_CHANNEL_ID = "1529065973401915492";
const COMMAND_CHANNEL = "פקודות-גלגל";
const STAFF_ROLE = "צוות";

let points = {};

if (fs.existsSync("points.json")) {
  points = JSON.parse(
    fs.readFileSync("points.json")
  );
}

function save() {
  fs.writeFileSync(
    "points.json",
    JSON.stringify(points, null, 2)
  );
}

const commands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("בדיקת נקודות"),

  new SlashCommandBuilder()
    .setName("addpoints")
    .setDescription("הוספת נקודות")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("משתמש")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("כמות נקודות")
        .setRequired(true)
    )
].map(command => command.toJSON());


client.once("ready", async () => {
  console.log(`מחובר בתור ${client.user.tag}`);

  const rest = new REST({ version: "10" })
    .setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    ),
    { body: commands }
  );
  const channel = client.channels.cache.get(
    WHEEL_CHANNEL_ID
  );

  if (channel) {
    const button = new ButtonBuilder()
      .setCustomId("spin")
      .setLabel("🎡 סובב גלגל")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(button);

    const embed = new EmbedBuilder()
      .setTitle("🎡 גלגל המזל")
      .setDescription(
        "לחץ על הכפתור כדי לסובב!\nעלות סיבוב: 1000 נקודות"
      );

    await channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});


client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;


  if (interaction.commandName === "balance") {

    const amount = points[interaction.user.id] || 0;

    return interaction.reply({
      content: `💎 יש לך ${amount} נקודות`,
      ephemeral: true
    });
  }


  if (interaction.commandName === "addpoints") {

    if (
      !interaction.member.roles.cache
      .some(role => role.name === STAFF_ROLE)
    ) {
      return interaction.reply({
        content: "❌ אין לך הרשאה",
        ephemeral: true
      });
    }


    if (interaction.channel.name !== COMMAND_CHANNEL) {
      return interaction.reply({
        content:
        `❌ הפקודה עובדת רק בחדר ${COMMAND_CHANNEL}`,
        ephemeral: true
      });
    }


    const user =
      interaction.options.getUser("user");

    const amount =
      interaction.options.getInteger("amount");


    points[user.id] =
      (points[user.id] || 0) + amount;


    save();


    return interaction.reply(
      `✅ נוספו ${amount} נקודות ל-${user}`
    );
  }

});
client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) return;

  if (interaction.customId !== "spin") return;


  const user = interaction.user;

  const currentPoints = points[user.id] || 0;


  if (currentPoints < COST) {
    return interaction.reply({
      content: "❌ אין לך מספיק נקודות לסיבוב",
      ephemeral: true
    });
  }


  points[user.id] -= COST;


  const prizes = [
    "💎 זכית ב־500 נקודות",
    "🔥 זכית ב־2000 נקודות",
    "🎁 זכית בפרס מיוחד",
    "😭 לא זכית הפעם"
  ];


  const prize =
    prizes[Math.floor(Math.random() * prizes.length)];


  if (prize.includes("500")) {
    points[user.id] += 500;
  }

  if (prize.includes("2000")) {
    points[user.id] += 2000;
  }


  save();


  const embed = new EmbedBuilder()
    .setTitle("🎡 תוצאת הגלגל")
    .setDescription(
      `${user} סובב את הגלגל וקיבל:\n\n${prize}`
    );


  return interaction.reply({
    embeds: [embed]
  });

});


client.login(TOKEN);
