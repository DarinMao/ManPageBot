// discord api and client
const Discord = require("discord.js");
const client = new Discord.Client();

// prefixes
const Prefix = require("./modules/prefix.js");
const prefix = new Prefix();

// config file for bot token
const config = require("./config.json");

// log
const log = require("simple-node-logger").createSimpleLogger();
if (process.env.NODE_ENV == "dev") {
    log.setLevel("debug");
}

/*
// http request
const request = require('request');
*/

// modules
const modules = {
  "ping": require("./modules/commands/ping.js"),
  "setprefix": require("./modules/commands/setprefix.js"),
  "help": require("./modules/commands/help.js"),
  "info": require("./modules/commands/info.js")
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
function updateStatus() {
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
	prefix.set(guild.id, "$");
});

// remove prefix and notify when guild is removed
client.on('guildDelete', guild => {
	prefix.remove(guild.id);
});

/*
// sends man page OBSOLETE WE WILL BE REPLACING JUST FOR REFERENCE
function sendManPage(channel, manInput) {
    channel.startTyping();
    var url = "https://www.freebsd.org/cgi/man.cgi?manpath=Debian+8.1.0&format=ascii&query=" + encodeURIComponent(manInput);
	request.get(url, function(error, response, body) {
		if (response.statusCode == 200)
		{
			if (body.indexOf("Sorry, no data found for") != -1 || body.indexOf("Empty input") != -1) {
				channel.send(":negative_squared_cross_mark: No manual entry for " + manInput);
			} else {
				var raw = body.replace(/`/g, "'");
				raw = raw.substring(raw.indexOf("NAME"));
				raw = raw.split("\n\n\n\n")[0];
				raw = raw.replace(/^_+\n+$/gm, "");
				raw = raw.replace(/^\n*$/gm, "");
				raw = raw.split(/\n(?=[A-Z])/);
				var embed = new Discord.RichEmbed().setColor(0x009698);
				for (var i = 0; i < raw.length; i++) {
					if (raw[i] == "") continue;
					var propertyName = raw[i].split(/\n +/)[0];
					var property = raw[i].split(/\n +/).slice(1).join("\n").replace(/	/g, " ");
					if (property.length > 1024) property = property.substring(0, 990) + "\n\n(more in full description below)";
					if (includeFields.indexOf(propertyName) != -1) embed.addField(propertyName, property);
				}
				embed.addField("Full description", url);
				channel.send({embed});
			}
		} else {
			channel.send(":negative_squared_cross_mark: Error " + response.statusCode + ": " + error);
		}
		channel.stopTyping();
	});
	if (dev) console.log("Executed command 'man' with '" + manInput + "' in channel " + message.channel.id + " by " + message.author.id);
}
*/

// detect commands
client.on("message", message => {
  // set unset prefix
  if (prefix.get(message.guild.id) == null) {
    prefix.set(message.guild.id, "$");
    log.debug(`Set unset prefix for ${message.guild.id}`);
  }
  // ignore bad messages
  if (message.author.bot
      || (message.content.indexOf(prefix.get(message.guild.id)) !== 0 && !message.isMentioned(client.user.id))
      || message.channel instanceof Discord.DMChannel) {
    log.debug(`Ignoring message ${message.id}`);
    return;
  }
  // get array of arguments and command
  var args = message.content.toLowerCase().replace(prefix.get(message.guild.id), "").replace(`<@${client.user.id}>`, "").trim().split(/ +/g);
  var command = args.shift();

  // execute
  if (command in modules) {
    const permission = modules[command].permission;
    for (let i = 0; i < permission.length; i++) {
      if (!message.member.hasPermission(permission[i])) {
        message.channel.send(":negative_squared_cross_mark: You are not allowed to do that!");
        log.debug(`Message ${message.id} not executed because missing permission ${permission[i]}`);
        return;
      }
    }
    modules[command].execute(prefix, command, args, message, client);
    log.debug(`Executed message ${message.id} command ${command} args ${args}`);
  }
});

// init prefix
prefix.init();

// start bot
client.login(config.token);

// errors
process.on('unhandledRejection', (reason) => {
	log.error(reason);
});
