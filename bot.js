const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content.substring(0, 1) == '!') {
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
						var name = body.substring(body.indexOf('<p style="margin-left:11%; margin-top: 1em">') + 44, body.indexOf('</p>')).replace("&minus;", "-").replace(/\r?\n|\r/g, " ").replace(/<.+>/g, "");
						message.channel.send("`" + name + "`");
						message.channel.send(url);
					}
				});
			break;
            // Just add any case commands if you want to..
         }
     }
});


client.login("MzcxMzU3NjU4MDA5MzA1MTAx.DM0dTg.2jd8WmVHggmvYT5_d-ZUV7UekUc");