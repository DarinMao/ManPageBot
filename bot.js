// discord api and client
const Discord = require('discord.js');
const client = new Discord.Client();

// http request
const request = require('request');

// store prefixes
const storage = require('node-persist');

// strip html tags from request
const striptags = require('striptags');

// evaluate html entities
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

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

// initialize synchronous storage
storage.initSync();

// load express view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set public folder
app.use(express.static(path.join(__dirname, 'public')));

// set app get data
app.get('/guilds', function(req, res) {
	res.send(client.guilds.size.toString());
});
app.get('/uptime', function(req, res) {
	res.send(format(process.uptime() * 1000));
});
app.get('/version', function(req, res) {
	res.send(pkg.version);
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
	// if dm
	if (message.channel instanceof Discord.DMChannel) {
		// if from me and is dumplog
		if (message.author.id == "288477253535399937" && message.content == "DUMPLOG") {
			message.channel.send("Here is the log file: ", {
				file: "./eventlog.log"
			}).catch(catchError);
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
		if (message.content.substring(0, 1) == storage.getItemSync(message.guild.id)) {
			// parse
			var args = message.content.substring(1).split(' ');
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
					message.channel.send('Pong! `' + ping + ' ms`').catch(catchError);
				break;
				// !man
				case 'man':
					if (arg == false)
					{
						message.channel.send(":negative_squared_cross_mark: Please specify a command!").catch(catchError);
					} else {
						arg = arg.toLowerCase();
						var url = "https://man.cx/" + arg;
						request.get(url, function(error, response, body) {
							if (response.statusCode == 200)
							{
								if (body.indexOf("NAME") == -1)
								{
									message.channel.send(":negative_squared_cross_mark: Couldn't find a man page for `" + arg + "`!");
								} else {
									var formatted = striptags(body.replace(/<\/?b>/g, "**").replace(/<\/?i>/g, "*").replace(/\*{3}/g, "** *").replace(/&nbsp;/g, ""), '<br>');
									var synopsis = false;
									if (formatted.indexOf("SYNOPSIS") == -1)
									{
										var name = entities.decode(formatted.substring(formatted.indexOf("NAME"), formatted.indexOf("DESCRIPTION")).replace(/\r?\n|\r/g, " ").replace(/<br>/g, "\n").replace(/NAME(\*+)?\s+/, "").replace(/\*+$/, ""));
									} else {
										var name = entities.decode(formatted.substring(formatted.indexOf("NAME"), formatted.indexOf("SYNOPSIS")).replace(/\r?\n|\r/g, " ").replace(/<br>/g, "\n").replace(/NAME(\*+)?\s+/, "").replace(/\*+$/, ""));
										var synopsis = entities.decode(formatted.substring(formatted.indexOf("SYNOPSIS"), formatted.indexOf("DESCRIPTION")).replace(/\r?\n|\r/g, " ").replace(/<br> /g, "\n").replace(/SYNOPSIS(\*+)?\s+/, "").replace(/\*+$/, ""));
										if (synopsis.length > 1024) synopsis = synopsis.substring(0, 990) + "\n\n(more in full description below)";
									}
									if (name.length > 1024) name = name.substring(0, 990) + "\n\n(more in full description below)";
									if (!synopsis)
									{
										var embed = new Discord.RichEmbed()
											.setColor(0x009698)
											.addField("NAME", name)
											.addField("Full description", "https://man.cx/" + arg);
									} else {
										var embed = new Discord.RichEmbed()
											.setColor(0x009698)
											.addField("NAME", name)
											.addField("SYNOPSIS", synopsis)
											.addField("Full description", "https://man.cx/" + arg);
									}
									message.channel.send({embed}).catch(catchError);
								}
							} else {
								message.channel.send(":negative_squared_cross_mark: Error " + response.statusCode + ": " + error).catch(catchError);
							}
						});
					}
				break;
				// !setprefix
				case 'setprefix':
					if (!message.member.hasPermission("MANAGE_GUILD") && message.author.id !== "288477253535399937") {
						message.channel.send(":negative_squared_cross_mark: You are not allowed to do that!").catch(catchError);
						return;
					}
					if (arg == false)
					{
						message.channel.send(":negative_squared_cross_mark: Please specify a prefix!").catch(catchError);
					} else {
						var prefix = arg.substring(0, 1);
						storage.setItemSync(message.guild.id, prefix);
						message.channel.send(":white_check_mark: Set prefix for this guild to " + args[1].substring(0, 1)).catch(catchError);
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
						.addField(prefix + "setprefix [prefix]", "Sets the bot command prefix for this guild (requires \"Manage Server\" permission)")
						.addField(prefix + "man [command]", "Gets manual page for specified command")
						.addField(prefix + "changelog", "Gets changelog for the bot")
						.addField("Notes", "- Commands do NOT work in DM.\n- Do not include brackets when typing commands.\n- The prefix can only be one character. If a prefix with more than one character is specified, the first character of the specified prefix will be used.");
					message.channel.send({embed}).catch(catchError);
				break;
				// !changelog
				case 'changelog':
					message.channel.send("Here is the changelog file: ", {
						file: "./ManPage_Bot_Changelog.txt"
					}).catch(catchError);
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
					message.channel.send({embed}).catch(catchError);
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
}).catch(catchError);

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
	log.error(e.stack);
	logToDm(e.name + ": " + e.message + " (Check logs for trace)");
}