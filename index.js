throw new Error("THIS IS A NEW VERSION");
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

const WHEEL_CHANNEL_ID = "1529065973401915492";
const COST = 1000;

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
    .setName("wheel")
    .setDescription("יצירת גלגל המזל"),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("בדיקת נקודות")
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
    {
      body: commands
    }
  );

});
client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;


  if (interaction.commandName === "wheel") {

    if (interaction.channel.id !== WHEEL_CHANNEL_ID) {
      return interaction.reply({
        content: "❌ הפקודה עובדת רק בחדר הגלגל",
        ephemeral: true
      });
    }


    const button = new ButtonBuilder()
      .setCustomId("spin")
      .setLabel("🎡 סובב גלגל")
      .setStyle(ButtonStyle.Primary);


    const row = new ActionRowBuilder()
      .addComponents(button);


    const embed = new EmbedBuilder()
      .setTitle("🎡 Lucky Wheel")
      .setDescription(
        "לחץ על הכפתור כדי לסובב!\n💎 מחיר: 1000 נקודות"
      );


    await interaction.reply({
      embeds: [embed],
      components: [row]
    });

  }


  if (interaction.commandName === "balance") {

    const amount = points[interaction.user.id] || 0;


    await interaction.reply({
      content: `💎 יש לך ${amount} נקודות`,
      ephemeral: true
    });

  }

});
client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) return;

  if (interaction.customId !== "spin") return;


  const user = interaction.user;

  const userPoints = points[user.id] || 0;


  if (userPoints < COST) {
    return interaction.reply({
      content: "❌ אין לך מספיק נקודות",
      ephemeral: true
    });
  }


  points[user.id] -= COST;


  const prizes = [
    { text: "💎 זכית ב־500 נקודות", amount: 500 },
    { text: "🔥 זכית ב־2000 נקודות", amount: 2000 },
    { text: "🎁 זכית בפרס מיוחד", amount: 0 },
    { text: "😭 לא זכית הפעם", amount: 0 }
  ];


  const prize =
    prizes[Math.floor(Math.random() * prizes.length)];


  points[user.id] += prize.amount;

  save();


  const embed = new EmbedBuilder()
    .setTitle("🎡 תוצאת הגלגל")
    .setDescription(
      `${user} סובב את הגלגל!\n\n${prize.text}`
    );


  await interaction.reply({
    embeds: [embed]
  });

});


client.login(TOKEN);
