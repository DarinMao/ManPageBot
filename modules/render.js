const Discord = require("discord.js");

const render = function(man) {
  let title = man.name;
  if (man.section > 0) {
    title += `(${man.section})\t${man.header}`;
  }
  const embed = new Discord.RichEmbed()
    .setTitle(title)
    .setColor(0x009698)
    .setURL(man.url);
  if (man.os != null) {
    embed.setDescription(man.os);
  }
  const include = Object.keys(man.sections);
  for (let i = 0; i < include.length; i++) {
    let property = man.sections[include[i]];
    if (property.length > 1024) property = property.substring(0, 990) + "\n\n(more in full description below)";
    embed.addField(include[i], property);
  }
  embed.addField("Full description", man.url);
  return embed;
}

module.exports = render;
