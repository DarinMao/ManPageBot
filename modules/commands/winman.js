const Discord = require("discord.js");
const axios = require("axios");
const windowsMan = axios.create({
  baseURL: "https://docs.microsoft.com/en-us/"
});

const parser = require("node-html-parser");
const render = require("../render.js");

const WinMan = function(log){
  this._log = log;
}
WinMan.prototype.execute = async function(prefix, command, args, message, client){
  await message.channel.startTyping();
  //generate url
  if(args.length < 1){ //invalid number of args
    return message.channel.send(":negative_squared_cross_mark: no manpage specified");
  }
  let winCommand = "";
  for(let i = 0; i < args.length; i++){ //spaces just become -'s.  This is for pages like "wbadmin stop job", which do exist
    if(i > 0){
      winCommand += '-';
    }
    winCommand += args[i];
  }
  let cmdurl = "/windows-server/administration/windows-commands/" + winCommand;
  let powershellurl = "/powershell/module/" + winCommand;
  let res;
  let successfulConnection;
  try{
    res = await windowsMan.get(cmdurl);
    successfulConnection = true;
  } catch(error) {
    successfulConnection = false;
  }
  if(!successfulConnection){ //very unfinished because this needs to look through github to actually find the command
    try{
      res = await windowsMan.get(powershellurl);
      successfulConnection = true;
    } catch(error){
      if(error.request.res.statusCode == 404){

      }
    }
  }
  if(!successfulConnection){ //there is an _1 in the name of the page (happens for cacls).  Least likely to occur, so it's last
    try{
      res = await windowsMan.get(cmdurl+"_1");
    } catch(error){
      if(error.request.res.statusCode == 404){
        return message.channel.send(":negative_squared_cross_mark: No manual entry for " + winCommand);
      } else {
        return message.channel.send("generic error fetching manpage occurred.");
      }
    }
  }
  const data = parser.parse(res.data.replace("<!-- <content> -->", "<content>").replace("<!-- </content> -->","</content>")); //parse data with the comments around the content tags removed.  makes searching for manpage elements faster
  const name = data.querySelector("h1").innerHTML;
  const manpageContent = data.querySelector("content").innerHTML.split("\n");
  console.log(manpageContent[2]);
}

WinMan.prototype.permission = ["SEND_MESSAGES"];

module.exports = WinMan;
