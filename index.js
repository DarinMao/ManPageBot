// discord api and client
const Discord = require("discord.js");
const client = new Discord.Client();

// prefixes
const prefix = require("./modules/prefix.js");

// config file for bot token
const config = require("./config.json");

//axios and parser for distro updates
const axios = require("axios");
const parser = require("node-html-parser");

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
const ping = require("./modules/commands/ping.js");
const setprefix = require("./modules/commands/setprefix.js");
const help = require("./modules/commands/help.js");
const info = require("./modules/commands/info.js");
const man = require("./modules/commands/man.js")
const modules = {
  "ping": ping,
  "setprefix": setprefix,
  "help": help,
  "info": info,
  "man": man
}

// log when discord client initialized
client.on('ready', () => {
	log.info("Bot initialized");
	updateStatus();
	setInterval(() => {
	    updateStatus();
	}, 10000);
});

//function for updating distro list
async function updatedDistros(){
  const distributions = new Array();
  const manpage = await axios.get("https://manned.org");
  const distroHTMLList = parser.parse(manpage.data).querySelector('#systems').innerHTML; //This part is split up for readability
  const distroList = parser.parse(distroHTMLList).querySelectorAll('a');
  for(let i = 0; i < distroList.length; i++){
      let distroName = distroList[i].attributes.href;
      if(distroName != "#"){ //href for more links
        distroName = distroName.match(/[^/]+$/g); //get substr of href after the last slash
        distributions.push(distroName[0]);
      }
  }
  return distributions;
}
updatedDistros().then(distroRun => {
  //I don't know how to handle this in order to pass it to man.js
}).catch(err => console.error(err));
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
});

// remove prefix and notify when guild is removed
client.on('guildDelete', guild => {
	prefix.remove(guild.id);
});

// detect commands
client.on("message", message => {
  // set unset prefix
  if (prefix.get(message.guild.id) == null) {
    prefix.set(message.guild.id, config.prefix);
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