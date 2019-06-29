# README

This is a Discord bot that fetches Linux and Windows manual pages. Version 6 is a complete rewrite with new features for Discord Hack Week. 

https://manpagebot.ml/ Has a command list or you can use !help. 

### Setup

Create a Discord bot and a bot user.

Create config.json, enter the bot token and a default prefix. For example,
```js
{
  "prefix": "!",
  "token": "NCAFAKEzTOKENTMxOrQ1FAKE.TOKENQ.QFAKEyTOKENvysEdFAKE-TOKENh"
}
```

Set up the Windows documentation repositories
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

Return to the root directory

`npm install`

`node index.js`
