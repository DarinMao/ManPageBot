const Discord = require("discord.js");

const Help = function(log) {
  this._log = log;
}

Help.prototype.execute = async function(prefix, command, args, message, client) {
  const p = prefix.get(message.guild.id);
  const embed = new Discord.RichEmbed()
    .setTitle("ManPage Bot Command List")
    .setDescription("This bot provides manual pages for Linux commands\n```This guild's prefix is currently set to: \"" + p + "\"```")
    .setColor(0x009698)
    .setThumbnail("https://i.imgur.com/TbEDUPm.png")
    .addField(p + "help", "Display this help message")
    .addField(p + "ping", "Pings the bot")
    .addField(p + "info", "Displays bot info")
    .addField(p + "setprefix *prefix*", "Sets the bot command prefix for this guild (requires \"Manage Server\" permission)")
    .addField(p + "man *command*", "Gets manual page for specified command")
    .addField("Notes", "- Commands do NOT work in DM.\n- Do not include brackets when typing commands.\n- The prefix must not have any whitespace in it");
  this._log.debug(`Sending help message in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return message.channel.send({embed});
}

Help.prototype.permission = ["SEND_MESSAGES"];

module.exports = Help;
