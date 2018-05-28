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
	serialComma: false,
	round: true
});

// express for web server
const express = require('express');
const app = express();
const path = require('path');

// fields to include
const includeFields = ["NAME", "SYNOPSIS", "DESCRIPTION", "USAGE", "OPTIONS"];

// global message variable
var globalMessage;

// initialize synchronous storage
storage.initSync();

// load express view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set public folder
app.use(express.static(path.join(__dirname, 'public')));

// set get changelog
app.get('/changelog', function(req, res) {
	res.sendFile(path.join(__dirname, 'ManPage_Bot_Changelog.txt'));
});

// log when discord client initialized
client.on('ready', () => {
	log.info('Bot initialized');
	logToDm('Bot initialized');
	// set app get root
	app.get('/', function(req, res) {
		res.render('index', {
			guilds: client.guilds.size,
			uptime: format(process.uptime() * 1000),
			version: pkg.version
		});
	});
	setServersStatus();
});

// set prefix and notify when guild is added
client.on('guildCreate', guild => {
	log.info('New guild: ' + guild.name + ' (' + guild.id + ')');
	logToDm('New guild: ' + guild.name + ' (' + guild.id + ')');
	storage.setItemSync(guild.id, '!');
	setServersStatus();
});

// remove prefix and notify when guild is removed
client.on('guildDelete', guild => {
	log.info('Guild removed: ' + guild.name + ' (' + guild.id + ')');
	logToDm('Guild removed: ' + guild.name + ' (' + guild.id + ')');
	storage.removeItemSync(guild.id);
	setServersStatus();
});

// detect commands
client.on('message', message => {
	globalMessage = message;
	// if dm
	if (message.channel instanceof Discord.DMChannel) {
		// if from me and is dumplog
		if (message.author.id == "288477253535399937") {
			if (message.content == "DUMPLOG")
			{
				message.channel.send("Here is the log file: ", {
					file: "./eventlog.log"
				}).catch(function(e) {
					catchError(e, "DM Dump Log");
				});
			}
		}
	} else {
		// if prefix has not yet been set, notify and set to !
		if (storage.getItemSync(message.guild.id) == undefined)
		{
			log.info('New guild: ' + guild.name + ' (' + guild.id + ')');
			logToDm('New guild: ' + guild.name + ' (' + guild.id + ')');
			storage.setItemSync(message.guild.id, '!');
		}
		// if prefix matches guild prefix
		if (message.content.indexOf(storage.getItemSync(message.guild.id)) == 0) {
			// parse
			var args = message.content.substring(storage.getItemSync(message.guild.id).length).split(/\s+/g);
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
					var ping = Math.round(client.ping);
					message.channel.send('Pong! `' + ping + ' ms`').catch(function(e) {
						catchError(e, "Send ping success; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalglobalMessage.guild.id + ")");
					});
				break;
				// !man
				case 'man':
					if (arg == false)
					{
						message.channel.send(":negative_squared_cross_mark: Please specify a command!").catch(function(e) {
							catchError(e, "Send no command specified error message; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
						});
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
									message.channel.send({embed}).catch(function(e) {
										catchError(e, "Send man page; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
									});
								}
							} else {
								message.channel.send(":negative_squared_cross_mark: Error " + response.statusCode + ": " + error).catch(function(e) {
									catchError(e, "Send HTTP request error message; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
								});
							}
						});
					}
				break;
				// !setprefix
				case 'setprefix':
					if (!message.member.hasPermission("MANAGE_GUILD") && message.author.id !== "288477253535399937") {
						message.channel.send(":negative_squared_cross_mark: You are not allowed to do that!").catch(function(e) {
							catchError(e, "Send user permissions error message; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
						});
						return;
					}
					if (arg == false)
					{
						message.channel.send(":negative_squared_cross_mark: Please specify a prefix!").catch(function(e) {
							catchError(e, "Send no prefix specified error message; hannel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
						});
					} else {
						storage.setItemSync(message.guild.id, arg);
						message.channel.send(":white_check_mark: Set prefix for this guild to " + arg).catch(function(e) {
							catchError(e, "Send setprefix success; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
						});
					}
				break;
				// !help
				case 'help':
					var prefix = storage.getItemSync(message.guild.id);
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
						.addField(prefix + "changelog", "Gets changelog for the bot")
						.addField("Notes", "- Commands do NOT work in DM.\n- Do not include brackets when typing commands.\n- The prefix must not have any whitespace in it");
					message.channel.send({embed}).catch(function(e) {
						catchError(e, "Send help message; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
					});
				break;
				// !changelog
				case 'changelog':
					message.channel.send("Here is the changelog file: ", {
						file: "./ManPage_Bot_Changelog.txt"
					}).catch(function(e) {
						catchError(e, "Send changelog; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
					});
				break;
				// !info
				case 'info':
					var prefix = storage.getItemSync(message.guild.id);
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
					message.channel.send({embed}).catch(function(e) {
						catchError(e, "Send info message; channel \"" + globalMessage.channel.name + "\" in guild \"" + globalMessage.guild.name + "\" (" + globalMessage.guild.id + ")");
					});
				break;
				// Just add any case commands if you want to..
			 }
		 }
	}
})

// start bot
client.login(config.token).then(function() {
	// start web server
	app.listen(8080, function() {
		log.info('Web initialized');
		logToDm('Web initialized');
	});
}).catch(function(e) {
	catchError(e, "Failed to initialize bot");
});

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

// catches all errors and logs them
function catchError(e) {
	catchError(e, "none provided");
}
function catchError(e, message) {
	log.error(e.stack);
	logToDm(e.name + ": " + e.message + " (Check logs for trace)\n```Additional information:\n" + message + "```");
}

process.on('unhandledRejection', (reason) => {
	log.error(reason);
	logToDm(reason.toString());
});