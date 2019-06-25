const Discord = require("discord.js");

const execute = async function(context) {
  const prefix = context.prefix.get(context.message.guild.id);
  const embed = new Discord.RichEmbed()
    .setTitle("ManPage Bot Command List")
    .setDescription("This bot provides manual pages for Linux commands\n```This guild's prefix is currently set to: \"" + prefix + "\"```")
    .setColor(0x009698)
    .setThumbnail("https://i.imgur.com/TbEDUPm.png")
    .addField(prefix + "help", "Display this help message")
    .addField(prefix + "ping", "Pings the bot")
    .addField(prefix + "info", "Displays bot info")
    .addField(prefix + "setprefix *prefix*", "Sets the bot command prefix for this guild (requires \"Manage Server\" permission)")
    .addField(prefix + "man *command*", "Gets manual page for specified command")
    .addField("Notes", "- Commands do NOT work in DM.\n- Do not include brackets when typing commands.\n- The prefix must not have any whitespace in it");
  context.message.channel.send({embed});
}

const permission = ["SEND_MESSAGES"];

module.exports = {execute, permission};
