[![Discord](https://discordapp.com/api/guilds/371377296285761558/widget.png)](https://discord.gg/hU3wMfQ)
[![Discord Bots](https://discordbots.org/api/widget/status/371357658009305101.svg)](https://discordbots.org/bot/371357658009305101)
[![ManPage Bot](https://cdn.discordapp.com/attachments/363484056769265687/594948471920787456/header.png)](https://manpagebot.ml/)
[![Join Discord](https://cdn.discordapp.com/attachments/363484056769265687/594948487163150341/discord.png)](https://discord.gg/hU3wMfQ)
[![Add ManPage Bot](https://cdn.discordapp.com/attachments/363484056769265687/594948502841327625/add.png)](https://discordapp.com/oauth2/authorize?client_id=371357658009305101&scope=bot&permissions=52224)

This is a Discord bot that fetches Linux and Windows manual pages. Version 6 is a complete rewrite with new features for Discord Hack Week. 

Use `!help` or view [the command list](https://manpagebot.ml/commands)

## Self Hosting

1. Create a Discord bot and a bot user. 
2. Create config.json, enter the bot token and a default prefix. For example,
    ```js
    {
      "prefix": "!",
      "token": "NCAFAKEzTOKENTMxOrQ1FAKE.TOKENQ.QFAKEyTOKENvysEdFAKE-TOKENh"
    }
    ```
3. Set up the Windows documentation repositories
    ```
    mkdir windows
    cd windows
    git init windowsserverdocs
    cd windowsserverdocs
    git remote add origin https://github.com/MicrosoftDocs/windowsserverdocs
    git config core.sparsecheckout true
    echo "WindowsServerDocs/administration/windows-commands/*" >> .git/info/sparse-checkout
    git pull --depth=1 origin master
    cd ..
    git init PowerShell-Docs
    cd PowerShell-Docs
    git remote add origin https://github.com/MicrosoftDocs/PowerShell-Docs
    git config core.sparsecheckout true
    echo "reference/5.1/*" >> .git/info/sparse-checkout
    git pull --depth=1 origin staging
    git checkout staging
    ```
4. Return to the root directory and start the bot
    ```
    npm install
    node index.js
    ```
