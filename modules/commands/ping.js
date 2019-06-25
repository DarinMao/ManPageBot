const execute = async function(prefix, command, args, message, client) {
  const APILatency = Math.round(client.ping);
  const m = await message.channel.send("Pong!\nAPI Latency: `" + APILatency + " ms`");
  const RTLatency = m.createdTimestamp - message.createdTimestamp;
  return m.edit("Pong!\nAPI Latency: `" + APILatency + " ms`\nMessage RTT: `" + RTLatency + " ms`");
}

const permission = ["SEND_MESSAGES"];

module.exports = {execute, permission};
