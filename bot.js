const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content.substring(0, 1) == process.env.PREFIX) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
		var man = args[1];
        switch(cmd) {
            // !ping
            case 'ping':
                message.channel.send('Pong!');
            break;
			// !man
			case 'man':
				var url = "https://man.cx/" + man;
				request.get(url, function(error, response, body) {
					if (response.statusCode == 200)
					{
						if (body.indexOf("Search results for") != -1)
						{
							message.channel.send(":negative_squared_cross_mark: Couldn't find a man page for `" + man + "`!");
						} else {
							var name = body.substring(body.indexOf('NAME</a></h2>') + 44, body.indexOf('</p>')).replace("&minus;", "-").replace(/\r?\n|\r/g, " ").replace(/<.+>(.+)<\/.+>/g, "$1");
							message.channel.send(":white_check_mark: Man page found for `" + man + "`!"); 
							message.channel.send("`" + name + "`");
							message.channel.send(url);
						}
					}
				});
			break;
			// !info
			case 'info':
				request.get("https://api.github.com/repos/DarinMao/manpagediscord/git/refs/heads/master", function(error, response, body) {
					if (response.statusCode == 200)
					{
						request.get(body.object.url, function(error, response, subbody) {
							if (response.statusCode == 200)
							{

								message.channel.send("```Discord Man Page Bot (Darin Mao)\n\nLast Update: " + subbody.committer.date + "(" + subbody.html_url + ")```");
								message.channel.send("Use `" + process.env.PREFIX + "help` for command list");
							}
						});
					}
				});
			break;
            // Just add any case commands if you want to..
         }
     }
});


client.login(process.env.BOT_TOKEN);