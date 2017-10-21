const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', function (user, userID, channelID, message, evt) {
    if (message.content.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
		var man = args[1];
        switch(cmd) {
            // !ping
            case 'ping':
                client.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
			// !man
			case 'man':
				client.sendMessage({
					to: channelID,
					message: 'Received: ' + man
				});
			break;
         }
     }
});


client.login("MzcxMzU3NjU4MDA5MzA1MTAx.DM0dTg.2jd8WmVHggmvYT5_d-ZUV7UekUc");