const Discord = require("discord.js");

const render = function(man) {
  let title = man.name;
  if (typeof man.section !== "undefined") {
    title += `(${man.section})`;
  }
  if (typeof man.header !== "undefined") {
    title += "\t" + man.header;
  }
  const embed = new Discord.RichEmbed()
    .setTitle(title)
    .setColor(0x009698)
    .setURL(man.url);
  if (typeof man.os !== "undefined") {
    embed.setDescription(man.os);
  }
  for (let section in man.sections) {
    let property = man.sections[section];
    if (property.length > 1024) {
      property = property.substring(0, 990);
      if ((property.match(/```/g) || []).length % 2 == 1) {
        property = property.substring(0, 987) + "```";
      }
      property += "\n\n(more in full description below)";
    }
    embed.addField(section, property);
  }
  embed.addField("Full description", man.url);
  return embed;
}

module.exports = render;
