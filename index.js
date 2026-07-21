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

const WHEEL_CHANNEL = "גלגל-מזל";
const COMMAND_CHANNEL = "פקודות-גלגל";
const STAFF_ROLE = "צוות";

let points = {};

if (fs.existsSync("points.json")) {
  points = JSON.parse(fs.readFileSync("points.json"));
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
    .setDescription("הוספת נקודות למשתמש")
    .addUserOption(o =>
      o.setName("user")
      .setDescription("משתמש")
      .setRequired(true))
    .addIntegerOption(o =>
      o.setName("amount")
      .setDescription("כמות נקודות")
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName("setupwheel")
    .setDescription("יצירת גלגל המזל")
].map(c => c.toJSON());


client.once("ready", async () => {

  console.log(`מחובר בתור ${client.user.tag}`);

  const rest = new REST({version:"10"})
    .setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    ),
    {body: commands}
  );

});


client.on("interactionCreate", async interaction => {


  if(interaction.isChatInputCommand()) {


    if(interaction.commandName === "balance") {

      const amount = points[interaction.user.id] || 0;

      return interaction.reply({
        content:`💎 יש לך ${amount} נקודות`,
        ephemeral:true
      });

    }



    if(interaction.commandName === "addpoints") {


      if(!interaction.member.roles.cache
      .some(r => r.name === STAFF_ROLE)) {

        return interaction.reply({
          content:"❌ אין לך הרשאה",
          ephemeral:true
        });

      }


      if(interaction.channel.name !== COMMAND_CHANNEL){

        return interaction.reply({
          content:`❌ הפקודה עובדת רק בחדר ${COMMAND_CHANNEL}`,
          ephemeral:true
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



    if(interaction.commandName === "setupwheel") {


      if(interaction.channel.name !== WHEEL_CHANNEL){

        return interaction.reply({
          content:`❌ השתמש בפקודה בחדר ${WHEEL_CHANNEL}`,
          ephemeral:true
        });

      }


      const button =
      new ButtonBuilder()
      .setCustomId("spin")
      .setLabel("🎡 סובב גלגל")
      .setStyle(ButtonStyle.Primary);


      const row =
      new ActionRowBuilder()
      .addComponents(button);


      const embed =
      new EmbedBuilder()
      .setTitle("🎡 גלגל המזל")
      .setDescription(
        "לחץ על הכפתור כדי לסובב!\nעלות: 1000 נקודות"
      );


      return interaction.reply({
        embeds:[embed],
        components:[row]
      });

    }

  }



  if(interaction.isButton()) {


    if(interaction.customId !== "spin")
    return;


    const user = interaction.user;


    if((points[user.id] || 0) < COST){

      return interaction.reply({
        content:"❌ אין לך מספיק נקודות",
        ephemeral:true
      });

    }


    points[user.id] -= COST;


    const prizes = [
      "💎 500 נקודות",
      "🎁 2000 נקודות",
      "🍀 זכית ברול מזל",
      "😭 לא זכית"
    ];


    const prize =
    prizes[Math.floor(Math.random()*prizes.length)];


    if(prize.includes("500"))
      points[user.id]+=500;

    if(prize.includes("2000"))
      points[user.id]+=2000;


    save();


    return interaction.reply(
      `🎡 ${user} סובב את הגלגל וקיבל:\n${prize}`
    );

  }

});


client.login(TOKEN);
