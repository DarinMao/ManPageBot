const Discord = require("discord.js");
const simpleGit = require("simple-git/promise");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile); // promisify because fs isn't promise based

const schedule = require("node-schedule");

const render = require("../render.js");

const fieldLimit = 4;

// this is really an MSGitMan but keep the name
const WinMan = function(git, path, remote, branch, log){
  this._gitPath = git;
  this._git = simpleGit(this._gitPath);
  this._path = path;
  this._remote = remote;
  this._branch = branch;
  this._log = log;
  this._updateGit();
  schedule.scheduleJob("0 0 * * 0", async () => {this._updateGit()});
}

WinMan.prototype._updateGit = async function() {
  this._git.pull("origin", this._branch, {"--depth": "1"});
  this._log.info("Pulled " + this._gitPath);
}

WinMan.prototype.execute = async function(prefix, command, args, message, client){
  // generate url
  if (args.length < 1){ // invalid number of args
    this._log.debug("Rejecting winman command with no arguments");
    return message.channel.send(":negative_squared_cross_mark: What manual page do you want?");
  }
  let name = "";
  for (let i = 0; i < args.length; i++) { // spaces just become -'s.  This is for pages like "wbadmin stop job", which do exist
    if (i > 0) {
      name += '-';
    }
    name += args[i];
  }

  let path = await this._git.raw(["ls-files", this._path + "*/" + name + ".md"]);
  if (path == null) {
    return message.channel.send(":negative_squared_cross_mark: No manual entry for " + name);
  }
  path = path.split("\n")[0];

  const file = await readFile(this._gitPath + "/" + path);
  console.log(file.toString("utf-8"));

  const url = this._remote + "/blob/" + this._branch + "/" + path;
  const header = "Windows Documentation";
  const sections = {};
  let sectionHead = "";
  let sectionContents = "";
  let fields = 0;
  /*
  let prevLineWasTable = false; //used to see if table setup is needed
  let tableBlockLength;
  // try {
  //   res = await axios.get(searchResults.items[0].url);
  //   searchResults = res.data;
  //   res = await axios.get(searchResults.download_url);
  //   const urlSplit = searchResults.download_url.substring(34).split('/');
  //   for(let i = 0; i < urlSplit.length; i++){
  //     url += "/" + urlSplit[i];
  //     if(i == 1){
  //       url += "/blob";
  //     }
  //   }
  //   searchResults = res.data;
  // } catch(error) {
  //   return message.channel.send("error fetching page!");
  // }
  const manPageLines = searchResults.split("\n");
  for (let i = 0; i < manPageLines.length; i++) {
    if (fields >= fieldLimit) {
      break; // limit reached
    }
    if(manPageLines[i] == ""){ // skip blank lines
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
  */

  //const man = {name, header, url, sections};
  const man = {name, header, url};
  const embed = render(man);
  return message.channel.send({embed});
}

WinMan.prototype.permission = ["SEND_MESSAGES"];

module.exports = WinMan;
