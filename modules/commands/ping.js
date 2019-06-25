const execute = async function(context) {
  const APILatency = Math.round(context.client.ping);
  const m = await context.message.channel.send("Pong!\nAPI Latency: `" + APILatency + " ms`");
  const RTLatency = m.createdTimestamp - context.message.createdTimestamp;
  return m.edit("Pong!\nAPI Latency: `" + APILatency + " ms`\nMessage RTT: `" + RTLatency + " ms`");
}

const permission = ["SEND_MESSAGES"];

module.exports = {execute, permission};
