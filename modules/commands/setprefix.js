const execute = async function(prefix, command, args, message, client) {
  if (args[0] == undefined) {
    message.channel.send(":negative_squared_cross_mark: Please specify a prefix!");
  } else {
    prefix.set(message.guild.id, args[0]);
    message.channel.send(":white_check_mark: Set prefix for this guild to " + args[0]);
  }
}

const permission = ["MANAGE_GUILD"];

module.exports = {execute, permission};
