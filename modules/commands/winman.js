const Discord = require("discord.js");
const axios = require("axios");
const windowsMan = axios.create({
  baseURL: "https://api.github.com/search/code?q=filename:"
});

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
  winCommand = winCommand.replace('|',''); //get rid of the '|' character that exists in some command names, but is not part of the file name
  const winUrls = [winCommand + "+repo:MicrosoftDocs/windowsserverdocs",
  winCommand + "+repo:MicrosoftDocs/PowerShell-Docs",
  winCommand + "+repo:MicrosoftDocs/windows-powershell-docs",
  winCommand + "+repo:MicrosoftDocs/azure-docs-powershell"];
  let successfulConnection = false;
  let indx = 0;
  let searchResults;
  let res;
  while(!successfulConnection && indx < winUrls.length){
    try{
      res = await windowsMan.get(winUrls[indx]);
    } catch(error) {
      console.log(error);
      return message.channel.send("error fetching page!");
    }
    searchResults = res.data;
    successfulConnection = searchResults.total_count > 0 && searchResults.items[0].name.toLowerCase() == winCommand.toLowerCase() + ".md";
    indx++;
  }
  if(!successfulConnection){
    return message.channel.send(":negative_squared_cross_mark: No manual entry for " + winCommand);
  }
  //important vars
  let name;
  const sections = {};
  let sectionHead = "";
  let sectionContents = "";
  let url = "https://github.com";
  const header = "Windows Documentation";
  const section = "0";
  const os = ""
  let fields = 0;
  let fieldLimit = 4;
  let prevLineWasTable = false; //used to see if table setup is needed
  let tableBlockLength;
  try{
    res = await axios.get(searchResults.items[0].url);
    searchResults = res.data;
    res = await axios.get(searchResults.download_url);
    const urlSplit = searchResults.download_url.substring(34).split('/');
    for(let i = 0; i < urlSplit.length; i++){
      url += "/" + urlSplit[i];
      if(i == 1){
        url += "/blob";
      }
    }
    searchResults = res.data;
  } catch(error) {
    return message.channel.send("error fetching page!");
  }
  const manPageLines = searchResults.split("\n");
  for(let i = 0; i < manPageLines.length; i++){
    if(fields >= fieldLimit){
      break; //limit reached
    }
    if(manPageLines[i] == ""){//skip blank lines
      continue;
    }
    if(manPageLines[i].charAt(0) == "#"){ //header
      if(manPageLines[i].charAt(1) != "#"){ //title
        name = manPageLines[i].substring(2).replace(/[\r\r]+/g, "");
      }
      if(sectionHead != "" && sectionContents.replace(/[\r\r]+/g, "") != ""){ //save
        sections[sectionHead] = sectionContents;
        fields++;
      }
      if(fields == 0){
        sectionHead = "Synopsis";
      } else {
        sectionHead = manPageLines[i].replace(/#/g,"");
      }
      sectionContents = "";
    }
    else if(sectionHead != "") {
      const unmodifiedManpageLine = manPageLines[i];
      manPageLines[i] = manPageLines[i].replace("> ", ""); // for the lines beginning with "> "
      if(manPageLines[i] == "[!CAUTION]"){
        manPageLines[i] == "*CAUTION!*";
      } else if(manPageLines[i].charAt(0) == "|"){
        const tableSplits = manPageLines[i].split("|");
        manPageLines[i] = "";
        if(!prevLineWasTable){
          tableBlockLength = tableSplits[1].length + 5;
        }
        for(let j = 1; j < tableSplits.length; j++){
          while(tableSplits[j].length < tableBlockLength){
            tableSplits[j] += " ";
          }
          manPageLines[i]+= tableSplits[j];
        }
        manPageLines[i]+= " \n ";
      }
      prevLineWasTable = unmodifiedManpageLine.charAt(0) == "|";
      sectionContents += manPageLines[i];
    }
  }
  await message.channel.stopTyping();
  const winman = {name, section, header, os, url, sections};
  const embed = render(winman);
  return message.channel.send({embed});
}

WinMan.prototype.permission = ["SEND_MESSAGES"];

module.exports = WinMan;
