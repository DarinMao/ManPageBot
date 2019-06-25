const execute = async function(context) {
  if (context.args[0] == undefined) {
    return context.message.channel.send(":negative_squared_cross_mark: Please specify a prefix!");
  } else {
    context.prefix.set(context.message.guild.id, context.args[0]);
    return context.message.channel.send(":white_check_mark: Set prefix for this guild to " + context.args[0]);
  }
}

const permission = ["MANAGE_GUILD"];

module.exports = {execute, permission};
