const Discord = require("discord.js");
const pkg = require('../../package.json');
const humanizeDuration = require('humanize-duration');
const format = humanizeDuration.humanizer({
	conjunction: ' and ',
	serialComma: true,
	round: true
});

const execute = async function(context) {
  const prefix = context.prefix.get(context.message.guild.id);
  const guilds = context.client.guilds.size;
  const uptime = format(process.uptime() * 1000);
  const version = pkg.version;
  const embed = new Discord.RichEmbed()
    .setTitle("ManPage Bot")
    .setDescription("This bot provides manual pages for Linux commands\nUse `" + prefix + "help` to view commands\n[Add ManPage Bot to your own server](https://discordapp.com/oauth2/authorize?client_id=371357658009305101&scope=bot&permissions=52224)\n[Join the ManPage Bot Discord server](https://discord.gg/hU3wMfQ)\n[Check out ManPage Bot on Discord Bot List](https://discordbots.org/bot/371357658009305101)")
    .setColor(0x009698)
    .setURL("https://manpagebot.ml")
    .setFooter("Ailuropoda Melanoleuca#0068 | Written using the discord.js node.js module", "https://i.imgur.com/tymDoDZ.jpg")
    .setThumbnail("https://i.imgur.com/TbEDUPm.png")
    .addField("Prefix", prefix, true)
    .addField("Guilds", guilds, true)
    .addField("Version", version, true)
    .addField("Uptime", uptime);
  context.message.channel.send({embed});
}

const permission = ["SEND_MESSAGES"];

module.exports = {execute, permission};
