const Ping = function(log) {
  this._log = log;
}

Ping.prototype.execute = async function(prefix, command, args, message, client) {
  const APILatency = Math.round(client.ping);
  this._log.debug(`Sending ping in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  const m = await message.channel.send("Pong!\nAPI Latency: `" + APILatency + " ms`");
  const RTLatency = m.createdTimestamp - message.createdTimestamp;
  this._log.debug(`Editing ping for RT in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return m.edit("Pong!\nAPI Latency: `" + APILatency + " ms`\nMessage RTT: `" + RTLatency + " ms`");
}

Ping.prototype.permission = ["SEND_MESSAGES"];

module.exports = Ping;
