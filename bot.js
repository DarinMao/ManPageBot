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
			// !info
			case 'info':
				var version;
				var latestCommitDate;
				var latestCommitURL;
				request.get("https://api.github.com/repos/DarinMao/manpagediscord/git/refs/heads/master", function(error, response, body) {
					if (response.statusCode == 200)
					{
						var JSONBody = JSON.parse(body);
						message.channel.send(body);
						request.get(JSONBody.object.url, function(suberror, subresponse, subbody) {
							if (subresponse.statusCode == 200)
							{
								var subJSONBody = JSON.parse(subbody);
								message.channel.send(subbody);
								latestCommitDate = subJSONBody.committer.date;
								latestCommitURL = subJSONBody.html_url;
								request.get("https://raw.githubusercontent.com/DarinMao/manpagediscord/master/package.json", function(versionerror, versionresponse, versionbody) {
									if (versionresponse.statusCode == 200)
									{
										var versionJSONBody = JSON.parse(versionbody);
										message.channel.send(versionbody);
										version = versionJSONBody.version;
										message.channel.send("```\nManPage bot v" + version + "\n\nGets *nix man pages in Discord\nUse " + process.env.PREFIX + "help to show commands\n```");
										message.channel.send("Latest Commit: " + latestCommitDate + " (" + latestCommitURL + ")");
									}
								});		
							}
						});
					}
				});
			break;
			// !help
			case 'help':
				var prefix = process.env.PREFIX;
				message.channel.send("```\n" + prefix + "help: Display this help message\n" + prefix + "info: Displays bot info\n" + prefix + "ping: Pings the bot\n" + prefix + "man [command]: Gets man page for command\n```");
			break;
            // Just add any case commands if you want to..
         }
     }
});


client.login(process.env.BOT_TOKEN);