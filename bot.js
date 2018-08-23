// discord api and client
const Discord = require('discord.js');
const client = new Discord.Client();

// http request
const request = require('request');

// store prefixes
const storage = require('node-persist');

// config file for bot token
const config = require('./config.json');

// logger
const log = require('simple-node-logger').createSimpleFileLogger({
	logFilePath: "eventlog.log",
	timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS"
});

// package file for version number
const pkg = require('./package.json');

// duration formatter
const humanizeDuration = require('humanize-duration');
const format = humanizeDuration.humanizer({
	conjunction: ' and ',
	serialComma: true,
	round: true
});

// fields to include
const includeFields = ["NAME", "SYNOPSIS", "DESCRIPTION", "USAGE", "OPTIONS"];

var prefixes = [];
(async () => {
	// initialize storage
	await storage.init();

	// load all prefixes
	let keys = await storage.keys();
	for (i = 0; i < keys.length; i++) {
		prefixes[keys[i]] = await storage.getItem(keys[i]);
	}
	console.log(prefixes);
	console.log("Loaded " + keys.length + " prefixes");
})();

// prefix handling

async function saveGuild(guild) {
	await storage.setItem(guild.id, '!');
	console.log("Guild saved: " + guild.id);
}

async function delGuild(guild) {
	await storage.removeItem(guild.id);
	console.log("Guild deleted: " + guild.id);
}

// log when discord client initialized
client.on('ready', () => {
	console.log("Bot initialized");
	log.info('Bot initialized');
	logToDm('Bot initialized');
	setServersStatus();
});

// set prefix and notify when guild is added
client.on('guildCreate', guild => {
	log.info('New guild: ' + guild.name + ' (' + guild.id + ')');
	logToDm('New guild: ' + guild.name + ' (' + guild.id + ')');
	prefixes[guild.id] = '!';
	saveGuild(guild);
	setServersStatus();
});

// remove prefix and notify when guild is removed
client.on('guildDelete', guild => {
	log.info('Guild removed: ' + guild.name + ' (' + guild.id + ')');
	logToDm('Guild removed: ' + guild.name + ' (' + guild.id + ')');
	delete prefixes[guild.id];
	delGuild(guild)
	setServersStatus();
});

// detect commands
client.on('message', message => {
	// if bot
	if (message.author.bot) return;
	// if dm
	if (message.channel instanceof Discord.DMChannel) {
		// if from me and is dumplog
		if (message.author.id == "288477253535399937") {
			if (message.content == "DUMPLOG")
			{
				message.channel.send("Here is the log file: ", {
					file: "./eventlog.log"
				});
				console.log("Sent log to owner");
			}
		}
	} else {
		// if prefix has not yet been set, notify and set to !
		if (prefixes[message.guild.id] == undefined)
		{
			log.info('New guild: ' + message.guild.name + ' (' + message.guild.id + ')');
			logToDm('New guild: ' + message.guild.name + ' (' + message.guild.id + ')');
			prefixes[message.guild.id] = '!';
			saveGuild(message.guild);
		}
		// if prefix matches guild prefix
		if (message.content.indexOf(prefixes[message.guild.id]) == 0) {
			// parse
			var args = message.content.substring(prefixes[message.guild.id].length).split(/\s+/g);
			var cmd = args[0];
			var arg;
			if (args.length == 1)
			{
				arg = false
			} else {
				arg = args[1];
			}
			// which command?
			switch(cmd) {
				// !ping
				case 'ping':
					var APILatency = Math.round(client.ping);
					const m = message.channel.send("Pong!\nAPI Latency: `" + APILatency + " ms`").then(m => {
						var RTLatency = m.createdTimestamp - message.createdTimestamp;
						m.edit("Pong!\nAPI Latency: `" + APILatency + " ms`\nMessage RTT: `" + RTLatency + " ms`");
					});
					console.log("Executed command 'ping'");
					logExec(message);
				break;
				// !man
				case 'man':
					if (arg == false)
					{
						message.channel.send(":negative_squared_cross_mark: Please specify a command!");
						console.log("Executed command 'man' with no command");
						logExec(message);
					} else {
						arg = arg.toLowerCase();
						var url = "https://www.freebsd.org/cgi/man.cgi?manpath=Debian+8.1.0&format=ascii&query=" + encodeURIComponent(arg);
						request.get(url, function(error, response, body) {
							if (response.statusCode == 200)
							{
								if (body.indexOf("Sorry, no data found for") != -1 || body.indexOf("Empty input") != -1) {
									message.channel.send(":negative_squared_cross_mark: No manual entry for " + arg);
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
									message.channel.send({embed});
								}
							} else {
								message.channel.send(":negative_squared_cross_mark: Error " + response.statusCode + ": " + error);
							}
						});
						console.log("Executed command 'man' with '" + arg + "'");
						logExec(message);
					}
				break;
				// !setprefix
				case 'setprefix':
					if (!message.member.hasPermission("MANAGE_GUILD") && message.author.id !== "288477253535399937") {
						message.channel.send(":negative_squared_cross_mark: You are not allowed to do that!");
						console.log("Executed command 'setprefix' without permissions");
						logExec(message);
						return;
					}
					if (arg == false)
					{
						message.channel.send(":negative_squared_cross_mark: Please specify a prefix!");
						console.log("Executed command 'setprefix' with permissions with no prefix");
						logExec(message);
					} else {
						prefixes[message.guild.id] = arg;
						saveGuild(message.guild);
						message.channel.send(":white_check_mark: Set prefix for this guild to " + arg);
						console.log("Executed command 'setprefix' with permissions with '" + arg + "'");
						logExec(message);
					}
				break;
				// !help
				case 'help':
					var prefix = prefixes[message.guild.id];
					var embed = new Discord.RichEmbed()
						.setTitle("ManPage Bot Command List")
						.setDescription("This bot provides manual pages for Linux commands\n```This guild's prefix is currently set to: \"" + prefix + "\"```")
						.setColor(0x009698)
						.setThumbnail("https://i.imgur.com/TbEDUPm.png")
						.addField(prefix + "help", "Display this help message")
						.addField(prefix + "ping", "Pings the bot")
						.addField(prefix + "info", "Displays bot info")
						.addField(prefix + "setprefix [prefix]", "Sets the bot command prefix for this guild (requires \"Manage Server\" permission)")
						.addField(prefix + "man [command]", "Gets manual page for specified command")
						.addField("Notes", "- Commands do NOT work in DM.\n- Do not include brackets when typing commands.\n- The prefix must not have any whitespace in it");
					message.channel.send({embed});
					console.log("Executed command 'help'");
					logExec(message);
				break;
				// !info
				case 'info':
					var prefix = prefixes[message.guild.id];
					var guilds = client.guilds.size;
					var uptime = format(process.uptime() * 1000);
					var version = pkg.version;
					var embed = new Discord.RichEmbed()
						.setTitle("ManPage Bot")
						.setDescription("This bot provides manual pages for Linux commands\nUse `" + prefix + "help` to view commands\n[Add ManPage Bot to your own server](https://discordapp.com/oauth2/authorize?client_id=371357658009305101&scope=bot&permissions=52224)\n[Join the ManPage Bot Discord server](https://discord.gg/hU3wMfQ)\n[Check out ManPage Bot on Discord Bot List](https://discordbots.org/bot/371357658009305101)")
						.setColor(0x009698)
						.setURL("http://manpagebot.tk/")
						.setFooter("Ailuropoda Melanoleuca#0068 | Written using the discord.js node.js module", "https://i.imgur.com/tymDoDZ.jpg")
						.setThumbnail("https://i.imgur.com/TbEDUPm.png")
						.addField("Prefix", prefix, true)
						.addField("Guilds", guilds, true)
						.addField("Version", version, true)
						.addField("Uptime", uptime);
					message.channel.send({embed});
					console.log("Executed command 'info'");
					logExec(message);
				break;
				// Just add any case commands if you want to..
			 }
		 }
	}
})

// start bot
client.login(config.token);

// sets the playing status to number of guilds
function setServersStatus() {
	var gameString = client.guilds.size + " guild";
	if (client.guilds.size != 1) gameString += "s";
	client.user.setPresence({ game: {name: gameString, type: 0} });
}

// sends log to my dm
function logToDm(messageToLog) {
	client.fetchUser("288477253535399937")
		.then(user => {user.send(messageToLog)});
}

function logExec(message) {
	console.log("Guild " + message.guild.id + " by user " + message.author.id);
}

process.on('unhandledRejection', (reason) => {
	console.log(reason);
	log.error(reason.stack || reason);
	logToDm(reason.toString());
});
