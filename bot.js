var dev = false;
if (process.env.NODE_ENV == "dev") {
    // DEV MODE ON
    var dev = true;
}

// discord api and client
const Discord = require('discord.js');
const client = new Discord.Client();

// http request
const request = require('request');

// store prefixes
const storage = require('node-persist');

// config file for bot token
const config = require('./config.json');

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
const includeFields = ["NAME", "SYNOPSIS", "DESCRIPTION", "USAGE", "OPTIONS", "PARAMETERS"];

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

async function saveGuild(guild, prefix) {
	await storage.setItem(guild.id, prefix);
	if (dev) console.log("Guild saved: " + guild.id + "(" + prefix + ")");
}

async function delGuild(guild) {
	await storage.removeItem(guild.id);
	if (dev) console.log("Guild deleted: " + guild.id);
}

// log when discord client initialized
client.on('ready', () => {
	console.log("Bot initialized");
	updateStatus();
	setInterval(() => {
	    updateStatus();
	}, 10000);
});

// set prefix and notify when guild is added
client.on('guildCreate', guild => {
	prefixes[guild.id] = "!";
	saveGuild(guild, "!");
});

// remove prefix and notify when guild is removed
client.on('guildDelete', guild => {
	delete prefixes[guild.id];
	delGuild(guild)
});

// sends man page
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

// detect commands
client.on('message', message => {
	// if prefix has not yet been set, notify and set to !
	if (prefixes[message.guild.id] == undefined)
	{
		prefixes[message.guild.id] = "!";
		saveGuild(message.guild, "!");
	}
	// ignore messages if:
	//  they are from a bot
	//  it does not start with the prefix or mention
	//  it is from a DM channel
    if (message.author.bot || (message.content.indexOf(prefixes[message.guild.id]) !== 0 && !message.isMentioned(client.user.id)) || message.channel instanceof Discord.DMChannel) return;
    
    // get array of arguments and command
    var args = message.content.toLowerCase().replace(prefixes[message.guild.id], "").replace(`<@${client.user.id}>`, "").trim().split(/ +/g);
    var command = args.shift();
	// which command?
	switch(command) {
		// !ping
		case 'ping':
			var APILatency = Math.round(client.ping);
			const m = message.channel.send("Pong!\nAPI Latency: `" + APILatency + " ms`").then(m => {
				var RTLatency = m.createdTimestamp - message.createdTimestamp;
				m.edit("Pong!\nAPI Latency: `" + APILatency + " ms`\nMessage RTT: `" + RTLatency + " ms`");
			});
			if (dev) console.log("Executed command 'ping' in channel " + message.channel.id + " by " + message.author.id);
		break;
		// !man
		case 'man':
		    // get argument
			var arg = args.shift();
			if (arg !== undefined) {
			    // call send man page
			    sendManPage(message.channel, arg);
			} else {
			    message.channel.send(":negative_squared_cross_mark: Please specify a command!");
			    if (dev) console.log("Executed command 'man' with no argument in channel " + message.channel.id + " by " + message.author.id);
			}
		break;
		// !setprefix
		case 'setprefix':
			if (!message.member.hasPermission("MANAGE_GUILD") && message.author.id !== "288477253535399937") {
				message.channel.send(":negative_squared_cross_mark: You are not allowed to do that!");
				if (dev) console.log("Executed command 'setprefix' without permissions in channel " + message.channel.id + " by " + message.author.id);
				return;
			}
			if (args[0] == undefined)
			{
				message.channel.send(":negative_squared_cross_mark: Please specify a prefix!");
				if (dev) console.log("Executed command 'setprefix' with permissions with no prefix in channel " + message.channel.id + " by " + message.author.id);
			} else {
				prefixes[message.guild.id] = args[0];
				saveGuild(message.guild, args[0]);
				message.channel.send(":white_check_mark: Set prefix for this guild to " + args[0]);
				if (dev) console.log("Executed command 'setprefix' with permissions with '" + arg[0] + "' in channel " + message.channel.id + " by " + message.author.id);
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
				.addField(prefix + "setprefix *prefix*", "Sets the bot command prefix for this guild (requires \"Manage Server\" permission)")
				.addField(prefix + "man *command*", "Gets manual page for specified command")
				.addField("Notes", "- Commands do NOT work in DM.\n- Do not include brackets when typing commands.\n- The prefix must not have any whitespace in it");
			message.channel.send({embed});
			if (dev) console.log("Executed command 'help' in channel " + message.channel.id + " by " + message.author.id);
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
				.setURL("https://manpagebot.ml")
				.setFooter("Ailuropoda Melanoleuca#0068 | Written using the discord.js node.js module", "https://i.imgur.com/tymDoDZ.jpg")
				.setThumbnail("https://i.imgur.com/TbEDUPm.png")
				.addField("Prefix", prefix, true)
				.addField("Guilds", guilds, true)
				.addField("Version", version, true)
				.addField("Uptime", uptime);
			message.channel.send({embed});
			if (dev) console.log("Executed command 'info' in channel " + message.channel.id + " by " + message.author.id);
		break;
		// Just add any case commands if you want to..
	}
});

// start bot
client.login(config.token);

/**
 * sets the playing status to
 *  guilds
 *  users
 *  help command
 */
var statusIndex = 0;
function updateStatus() {
    if (statusIndex == 0) {
    	var gameString = client.guilds.size + " guild";
    	if (client.guilds.size != 1) gameString += "s";
    	client.user.setActivity(gameString);
    	if (dev) console.log("Changed to guilds status");
    	statusIndex++;
    }
    else if (statusIndex == 1) {
        var gameString = client.users.size + " user";
        if (client.users.size != 1) gameString += "s";
        client.user.setActivity(gameString);
        if (dev) console.log("Changed to users status");
        statusIndex++;
    }
    else if (statusIndex == 2) {
        client.user.setActivity("use !help");
        if (dev) console.log("Changed to help status");
        statusIndex = 0;
    }
}

process.on('unhandledRejection', (reason) => {
	console.log(reason);
});
