const Discord = require("discord.js");
const simpleGit = require("simple-git/promise");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile); // promisify because fs isn't promise based
const schedule = require("node-schedule");
const AsciiTable = require("ascii-table");

const render = require("../render.js");

const fieldLimit = 3;

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
  //rudimentary code to make the bot a little more case insensitive as a compromise to not searching through the entire file system
  if(this._gitPath == "./windows/windowsserverdocs"){ //just use toLowerCase to make the bot case insensitive
    name = name.toLowerCase();
  }
  else if(this._gitPath == "./windows/PowerShell-Docs"){
    const nameSplit = name.split("-");
    name = "";
    for(let i = 0; i < nameSplit.length; i++){
      if(nameSplit[i].substring(0, 2).toLowerCase() == "ps"){
        nameSplit[i] = nameSplit[i].substring(0, 3).toUpperCase() + nameSplit[i].substring(3); //the letter right after PS is always capitalized in these docs
      } else {
        nameSplit[i] = nameSplit[i].substring(0, 1).toUpperCase() + nameSplit[i].substring(1);
      }
      if(i > 0){
        name += "-";
      }
      name += nameSplit[i];
    }
  }

  this._log.debug("Running git ls-files with built name " + name);
  let path = await this._git.raw(["ls-files", this._path + "*/" + name + ".md"]);
  if (path == null) {
    this._log.debug("Git returned no files");
    return message.channel.send(":negative_squared_cross_mark: No manual entry for " + name);
  }
  path = path.split("\n")[0];
  this._log.debug("Found path is " + path);

  const file = await readFile(this._gitPath + "/" + path);
  const fileText = file.toString("utf-8");
  const manText = fileText.substring(fileText.indexOf("---", 3)+3).split(/\r?\n/);

  const url = this._remote + "/blob/" + this._branch + "/" + path;
  this._log.debug("Built URL is " + url);
  const header = "Windows Documentation";
  const sections = {};
  let sectionHead = "";
  let sectionContents = "";
  let fields = 0;
  let quote = false;
  let table = false;
  const tableObj = new AsciiTable();
  for (let line of manText) {
    line = line
        .replace(/\/?a<[^>]*>/ig, "")
        .replace(/\[(.+)\]\(.+\)/g, "$1");
    if (fields >= fieldLimit) {
      this._log.debug("Field limit reached");
      break;
    }
    // deal with quotes
    // > like this
    // > one
    if (line.startsWith(">")) {
      if (!quote) {
        this._log.debug("New block quote");
        sectionContents += "```\n";
        quote = true;
      }
      sectionContents += line.substring(1);
      continue;
    } else if (quote) {
      this._log.debug("End block quote");
      sectionContents += "\n```\n";
      quote = false;
      continue;
    }
    // deal with tables
    if (/(\|-+)+\|/.test(line)) { // ignore the first row of dashes
      continue;
    }
    if (line.startsWith("|")) {
      if (!table) {
        this._log.debug("Creating new table");
        tableObj.clear();
        tableObj.removeBorder();
        tableObj.setHeadingAlignLeft();
        const tableHeadings = line.split(/ *\| */);
        tableHeadings.shift();
        tableHeadings.pop();
        this._log.debug("Table headings " + tableHeadings);
        tableObj.setHeading.apply(tableObj, tableHeadings);
        table = true;
        continue;
      }
      const tableRow = line.replace(/\\/g, "").split(/ *\| */);
      tableRow.shift();
      tableRow.pop();
      this._log.debug("Add table row " + tableRow[0]);
      tableObj.addRow.apply(tableObj, tableRow);
      continue;
    } else if (table) {
      this._log.debug("End table");
      sectionContents += "```\n" + tableObj.toString() + "\n```\n";
      table = false;
      continue;
    }
    // normal things
    if (line == "") {
      continue;
    }
    if (line.startsWith("# ")) { // top level heading
      name = line.substring(2);
      this._log.debug("Page heading is " + name);
      sectionHead = name;
      sectionContents = "**" + this._gitPath.split("/").pop() + "**\n";
    } else if (line.startsWith("## ")) { // heading 2, new section
      if (sectionHead != "") {  // if not empty, save
        this._log.debug("Adding " + sectionHead);
        sections[sectionHead] = sectionContents;
        fields++;
      }
      sectionContents = "";
      sectionHead = line.substring(3);
    } else if (line.startsWith("#")) {
      sectionContents += line.replace(/#+ /, "**") + "**\n";
    } else {
      sectionContents += line;
      sectionContents += "\n";
    }
  }
  if (fields < fieldLimit) {
    this._log.debug("Adding " + sectionHead);
    sections[sectionHead] = sectionContents;
  }

  const man = {name, header, url, sections};
  //const man = {name, header, url};
  const embed = render(man);
  this._log.debug(`Sending winman page ${man.name} in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return message.channel.send({embed});
}

WinMan.prototype.permission = ["SEND_MESSAGES"];

module.exports = WinMan;
