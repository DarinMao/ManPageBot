const log = require("../logger.js");

const Ping = function() {}

Ping.prototype.execute = async function(prefix, command, args, message, client) {
  const APILatency = Math.round(client.ping);
  log.debug(`Sending ping in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  const m = await message.channel.send("Pong!\nAPI Latency: `" + APILatency + " ms`");
  const RTLatency = m.createdTimestamp - message.createdTimestamp;
  log.debug(`Editing ping for RT in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return m.edit("Pong!\nAPI Latency: `" + APILatency + " ms`\nMessage RTT: `" + RTLatency + " ms`");
}

Ping.prototype.permission = ["SEND_MESSAGES"];
Ping.prototype.strip = true;

module.exports = Ping;
