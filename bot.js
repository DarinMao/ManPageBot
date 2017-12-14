const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();

let req = request.defaults({
	headers: {
		'User-Agent': 'DarinMao'
	}
});

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content.substring(0, 1) == process.env.PREFIX) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
		var man;
		if (args.length == 1)
		{
			man = false
		} else {
			man = args[1];
		}
        switch(cmd) {
            // !ping
            case 'ping':
                message.channel.send('Pong!');
            break;
			// !man
			case 'man':
				if (man == false)
				{
					message.channel.send(":negative_squared_cross_mark: Please specify a command!");
				} else {
					var url = "https://man.cx/" + man;
					request.get(url, function(error, response, body) {
						if (response.statusCode == 200)
						{
							if (body.indexOf("NAME") == -1)
							{
								message.channel.send(":negative_squared_cross_mark: Couldn't find a man page for `" + man + "`!");
							} else {
								var name = body.substring(body.indexOf("NAME") + 61, body.indexOf("</p>", body.indexOf("NAME") + 61)).replace(/&.*;/g, "-").replace(/\r?\n|\r/g, " ").replace(/<.+>(.+)<\/.+>/g, "$1");
								message.channel.send(":white_check_mark: Man page found for `" + man + "`!"); 
								message.channel.send("`" + name + "`");
								message.channel.send(url);
							}
						} else {
							message.channel.send(":negative_squared_cross_mark: Error " + response.statusCode + ": " + error);
						}
					});
				}
			break;
			// !help
			case 'help':
				var prefix = process.env.PREFIX;
				message.channel.send("```\nStandard Command List\n```\n**1. " + prefix + "help -** Display this help message\n**2. " + prefix + "ping -** Pings the bot\n**3. " + prefix + "man {command} -** Gets man page for specified command\n```\nDon't include the brackets when typing man commands!\n```");
			break;
			case 'muteaaron':
				const aaron = new Discord.GuildMember(241289238421700609);
				aaron.setMute(true);
			break;
            // Just add any case commands if you want to..
         }
     }
});


client.login(process.env.BOT_TOKEN);