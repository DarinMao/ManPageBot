const SetPrefix = function(log) {
  this._log = log;
}

SetPrefix.prototype.execute = async function(prefix, command, args, message, client) {
  if (args[0] == undefined) {
    this._log.debug("Rejecting setprefix command with no arguments");
    return message.channel.send(":negative_squared_cross_mark: Please specify a prefix!");
  } else {
    this._log.debug(`Setting prefix for ${message.guild.name} (${message.guild.id}) to ${args[0]}`);
    prefix.set(message.guild.id, args[0]);
    return message.channel.send(":white_check_mark: Set prefix for this guild to " + args[0]);
  }
}

SetPrefix.prototype.permission = ["MANAGE_GUILD"];

module.exports = SetPrefix;
