// discord api and client
const Discord = require("discord.js");
const client = new Discord.Client();

// prefixes
const prefix = require("./modules/prefix.js");
prefix.init();

// config file for bot token
const config = require("./config.json");
const owners = new Set(config.owners);

// log file
const log = require("./modules/logger.js");

// log all errors and continue
process.on('unhandledRejection', (reason) => {
	log.error(reason);
});

// modules
const Ping = require("./modules/commands/ping.js");
const SetPrefix = require("./modules/commands/setprefix.js")
const Help = require("./modules/commands/help.js")
const Info = require("./modules/commands/info.js")
const Man = require("./modules/commands/man.js")
const WinMan = require("./modules/commands/winman.js");
const modules = {
  ping: new Ping(),
  setprefix: new SetPrefix(),
  help: new Help(),
  info: new Info(),
  man: new Man(),
  winman: new WinMan("./windows/windowsserverdocs",
      "WindowsServerDocs/administration/windows-commands",
      "https://github.com/MicrosoftDocs/windowsserverdocs",
      "master"),
  get cmdman() {return this.winman;},
  poshman: new WinMan("./windows/PowerShell-Docs",
      "reference/5.1/**",
      "https://github.com/MicrosoftDocs/PowerShell-Docs",
      "staging"),
  get psman() {return this.poshman;}
}

// log when discord client initialized
client.on('ready', () => {
	log.info("Bot initialized");
	updateStatus();
	setInterval(() => {
	    updateStatus();
	}, 10000);
});

// status messages
let statusIndex = 0;
const updateStatus = () => {
    if (statusIndex == 0) {
    	let gameString = client.guilds.size + " guild";
    	if (client.guilds.size != 1) gameString += "s";
    	client.user.setActivity(gameString);
      log.debug("Set status to guilds");
    	statusIndex++;
    }
    else if (statusIndex == 1) {
        let gameString = client.users.size + " user";
        if (client.users.size != 1) gameString += "s";
        client.user.setActivity(gameString);
        log.debug("Set status to users");
        statusIndex++;
    }
    else if (statusIndex == 2) {
        client.user.setActivity("use !help");
        log.debug("Set status to help");
        statusIndex = 0;
    }
}

// set prefix and notify when guild is added
client.on('guildCreate', guild => {
	prefix.set(guild.id, config.prefix);
  log.debug("New guild " + guild.id);
});

// remove prefix and notify when guild is removed
client.on('guildDelete', guild => {
	prefix.remove(guild.id);
  log.debug("Guild removed " + guild.id);
});

// detect commands
client.on("message", async message => {
  // set unset prefix
  if (prefix.get(message.guild.id) == null) {
    prefix.set(message.guild.id, config.prefix);
    log.debug(`Set unset prefix for ${message.guild.id}`);
  }
  // ignore bad messages
  if (message.author.bot
      || message.channel instanceof Discord.DMChannel
      || (message.content.indexOf(prefix.get(message.guild.id)) !== 0 && !message.isMentioned(client.user.id))) {
    return;
  }
  // get array of arguments and command
  var args = message.content.toLowerCase().replace(prefix.get(message.guild.id), "").replace(`<@${client.user.id}>`, "").trim().split(/ +/g);
  var command = args.shift();

  // execute
  if (command in modules) {
		if (modules[command].strip) {
			args = args.join(" ").replace(/[^A-Za-z\d\s-]/g, "").trim().split(/ +/g);
		}
		if (!owners.has(message.author.id)) {
	    const permissions = modules[command].permission;
	    for (let permission of permissions) {
	      if (!message.member.hasPermission(permission)) {
	        message.channel.send(":negative_squared_cross_mark: You are not allowed to do that!");
	        log.debug(`Message ${message.id} not executed because missing permission ${permission}`);
	        return;
	      }
	    }
		} else {
			log.debug(`Owner bypass permission check for message ${message.id}`)
		}
    log.debug(`Executing message ${message.id} command ${command} args ${args}`);
    message.channel.startTyping();
    try {
      await modules[command].execute(prefix, command, args, message, client);
    } catch (error) {
      if (error.name == "DiscordAPIError" && error.code == 50013) {
        await message.channel.send(":negative_squared_cross_mark: I am not allowed to do that, please allow me to embed links and attach files!");
      } else {
        await message.channel.send(":negative_squared_cross_mark: I couldn't execute that command, please contact a developer!");
      }
    }
    message.channel.stopTyping(true);
  }
});

// start bot
client.login(config.token);
