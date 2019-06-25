const Discord = require("discord.js");

const render = function(man, include) {
  let title = man.name;
  if (man.section > 0) {
    title += `(${man.section})\t${man.sectionName}`;
  }
  const embed = new Discord.RichEmbed()
    .setTitle(title)
    .setColor(0x009698)
    .setURL(man.url);
  if (man.os != "") {
    embed.setDescription(man.os);
  }
  for (let i = 0; i < include.length; i++) {
    if (include[i] in man.sections) {
      let property = man.sections[include[i]];
      if (property.length > 1024) property = property.substring(0, 990) + "\n\n(more in full description below)";
      embed.addField(include[i], property);
    }
  }
  embed.addField("Full description", man.url);
  return embed;
}

module.exports = render;
