[![Discord](https://discordapp.com/api/guilds/371377296285761558/widget.png)](https://discord.gg/hU3wMfQ)
[![top.gg status](https://top.gg/api/widget/status/371357658009305101.svg)](https://top.gg/bot/371357658009305101)
[![top.gg servers](https://top.gg/api/widget/servers/371357658009305101.svg)](https://top.gg/bot/371357658009305101)
![Version](https://img.shields.io/github/package-json/v/DarinMao/ManPageBot.svg)
[![ManPage Bot](https://cdn.discordapp.com/attachments/363484056769265687/594948471920787456/header.png)](https://manpagebot.tk/)
[![Join Discord](https://cdn.discordapp.com/attachments/363484056769265687/594948487163150341/discord.png)](https://discord.gg/hU3wMfQ)
[![Add ManPage Bot](https://cdn.discordapp.com/attachments/363484056769265687/594948502841327625/add.png)](https://discordapp.com/oauth2/authorize?client_id=371357658009305101&scope=bot&permissions=52224)

This is a Discord bot that fetches Linux and Windows manual pages. Version 6 is a complete rewrite with new features for Discord Hack Week. 

Use `!help` or view [the command list](https://manpagebot.tk/commands)

## Self Hosting

1. Create a Discord bot and a bot user. 
2. Create config.json, enter the bot token, a default prefix, and a list of owner IDs. For example,
    ```js
    {
      "prefix": "!",
      "token": "NCAFAKEzTOKENTMxOrQ1FAKE.TOKENQ.QFAKEyTOKENvysEdFAKE-TOKENh",
      "owners": [
        "288477253535399937",
        "217322331385757697"
      ]
    }
    ```
3. Set up the Windows documentation repositories
    ```
    mkdir windows
    cd windows
    git clone https://github.com/MicrosoftDocs/windowsserverdocs
    cd windowsserverdocs
    git checkout master
    cd ..
    git clone https://github.com/MicrosoftDocs/PowerShell-Docs
    cd PowerShell-Docs
    git checkout staging
    ```
4. Return to the root directory and start the bot
    ```
    npm install
    node index.js
    ```
