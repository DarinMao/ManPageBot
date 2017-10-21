const Discord = require('discord.js');
const https = require('https');
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
			case 'man':
				var options = {
					host: "man.cx",
					path: "/" + man
				};
				var req = https.get(options, function(res) {
					message.channel.send("STATUS: " + res.statusCode);
					message.channel.send("HEADERS: " + JSON.stringify(res.headers));

					var bodyChunks = [];
					res.on('data', function(chunk) {
						bodyChunks.push(chunk);
					});.on('end', function() {
						var body = Buffer.concat(bodyChunks);
						message.channel.send("BODY: " + body);
					});
				});
				req.on('error', function(e) {
					message.channel.send("ERROR: " + e.message);
				});
			break;
            // Just add any case commands if you want to..
         }
     }
});


client.login("MzcxMzU3NjU4MDA5MzA1MTAx.DM0dTg.2jd8WmVHggmvYT5_d-ZUV7UekUc");