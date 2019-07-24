const Discord = require("discord.js");
const simpleGit = require("simple-git/promise");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile); // promisify because fs isn't promise based
const schedule = require("node-schedule");
const AsciiTable = require("ascii-table");

const render = require("../render.js");
const log = require("../logger.js");

const fieldLimit = 3;

// this is really an MSGitMan but keep the name
const WinMan = function(git, path, remote, branch){
  this._gitPath = git;
  this._git = simpleGit(this._gitPath);
  this._path = path;
  this._remote = remote;
  this._branch = branch;
  this._updateGit();
  schedule.scheduleJob("0 0 * * 0", async () => {this._updateGit()});
}

WinMan.prototype._updateGit = async function() {
  await this._git.pull("origin", this._branch);
  await this._git.reset("hard");
  log.info("Pulled " + this._gitPath);
}

WinMan.prototype.execute = async function(prefix, command, args, message, client){
  // generate url
  if (args.length < 1){ // invalid number of args
    log.debug("Rejecting winman command with no arguments");
    return message.channel.send(":negative_squared_cross_mark: What manual page do you want?");
  }
  let name = "";
  for (let i = 0; i < args.length; i++) { // spaces just become -'s.  This is for pages like "wbadmin stop job", which do exist
    if (i > 0) {
      name += '-';
    }
    name += args[i];
  }
  name = name.replace(/[^A-Za-z\d\s-]/g, "");

  log.debug("Running git ls-files with built name " + name);
  // build a string for case insensitive searching
  // since ls-files doesn't actually support this
  // cd => [cC][dD]
  let iCaseName = "";
  [...name].forEach(c => {
    iCaseName += "[" + c.toLowerCase() + c.toUpperCase() + "]"
  });
  iCaseName = this._path + "/" + iCaseName;
  let path = await this._git.raw(["ls-files", iCaseName+".md"]);
  log.debug("Searching for " + iCaseName);
  if (path == null) {
    log.debug("Git returned no files");
    return message.channel.send(":negative_squared_cross_mark: No manual entry for " + name);
  }
  path = path.split("\n")[0];
  log.debug("Found path is " + path);

  const file = await readFile(this._gitPath + "/" + path);
  const fileText = file.toString("utf-8");
  const manText = fileText.substring(fileText.indexOf("---", 3)+3).split(/\r?\n/);

  const url = this._remote + "/blob/" + this._branch + "/" + path;
  log.debug("Built URL is " + url);
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
      log.debug("Field limit reached");
      break;
    }
    // deal with quotes
    // > like this
    // > one
    if (line.startsWith(">")) {
      if (!quote) {
        log.debug("New block quote");
        sectionContents += "```\n";
        quote = true;
      }
      sectionContents += line.substring(1);
      continue;
    } else if (quote) {
      log.debug("End block quote");
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
        log.debug("Creating new table");
        tableObj.clear();
        tableObj.removeBorder();
        tableObj.setHeadingAlignLeft();
        const tableHeadings = line.split(/ *(?<!\\)\| */);
        tableHeadings.shift();
        tableHeadings.pop();
        log.debug("Table headings " + tableHeadings);
        tableObj.setHeading.apply(tableObj, tableHeadings);
        table = true;
        continue;
      }
      const tableRow = line.split(/ *(?<!\\)\| */)
      tableRow.forEach((e, i, a) => {
        a[i] = e.replace(/\\/g, "");
      });
      tableRow.shift();
      tableRow.pop();
      log.debug("Add table row " + tableRow[0]);
      tableObj.addRow.apply(tableObj, tableRow);
      continue;
    } else if (table) {
      log.debug("End table");
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
      log.debug("Page heading is " + name);
      sectionHead = name;
      sectionContents = "**" + this._gitPath.split("/").pop() + "**\n";
    } else if (line.startsWith("## ")) { // heading 2, new section
      if (sectionHead != "") {  // if not empty, save
        log.debug("Adding " + sectionHead);
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
    log.debug("Adding " + sectionHead);
    sections[sectionHead] = sectionContents;
  }

  const man = {name, header, url, sections};
  //const man = {name, header, url};
  const embed = render(man);
  log.debug(`Sending winman page ${man.name} in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return message.channel.send({embed});
}

WinMan.prototype.permission = ["SEND_MESSAGES"];
WinMan.prototype.strip = true;

module.exports = WinMan;
