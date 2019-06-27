const Discord = require("discord.js");
const axios = require("axios");
const manned = axios.create({
  baseURL: "https://manned.org/"
});
const parser = require("node-html-parser");
const schedule = require("node-schedule");
const render = require("../render.js");

// fields to exclude
const exclude = new Set(["AUTHOR", "REPORTING BUGS", "COPYRIGHT", "SEE ALSO"]);

const Man = function(log) {
  this._log = log;
  this._distros = [];
  this._updateDistros();
  const job = schedule.scheduleJob("0 0 * * 0", async () => {this._updateDistros()});
}

Man.prototype._resolveDistro = function(distro) {
  for (let i = 0; i < this._distros.length; i++) {
    if (this._distros[i] == distro || this._distros[i].split("-")[0] == distro) {
      return this._distros[i];
    }
  }
  return undefined;
}

Man.prototype._updateDistros = async function (){
  const distributions = [];
  const manpage = await manned.get("/");
  this._log.debug("Retrieved Linux distribution list");
  const distroHTMLList = parser.parse(manpage.data).querySelector("#systems").innerHTML; // this part is split up for readability
  const distroList = parser.parse(distroHTMLList).querySelectorAll("a");
  for (let i = 0; i < distroList.length; i++){
    let distroName = distroList[i].attributes.href;
    if (distroName != "#"){ // href for more links
      distroName = distroName.match(/[^/]+$/g); // get substr of href after the last slash
      distributions.push(distroName[0]);
      this._log.debug("Found distribution " + distroName[0]);
    }
  }
  this._distros = distributions;
  this._log.info("Updated Linux distribution list");
  return distributions;
}

Man.prototype.execute = async function(prefix, command, args, message, client) {
  await message.channel.startTyping();
  // parse args
  let distro;
  let section;
  let name;
  if (args.length < 1) { // reject things that have invalid # of arguments
    this._log.debug("Rejecting man command with no arguments");
    return message.channel.send(":negative_squared_cross_mark: What manual page do you want?");
  }
  let arg = 0;
  while (args.length > 0) {
    if(args.length > 1){
      if ((arg = parseInt(args[0])) == parseFloat(args[0])
          && (arg >= 1 && arg <= 9)) { // it is a valid section # (integer between 1 and 9)
        section = args.shift();
      } else if (typeof (distro = this._resolveDistro(args[0])) !== "undefined") { // it is a valid distro
        args.shift();
      }
   } else { // it's the command and also the last arg
      name = args.shift();
      break;
    }
  }

  // build URL
  let url = "/";
  if (typeof distro !== "undefined") {
    url += "man/" + distro + "/";
  }
  url += name;
  if (typeof section !== "undefined") {
    url += "." + section;
  }
  this._log.debug("Built URL is " + url);

  // fetch and parse the man page
  let res;
  try {
    res = await manned.get(url);
  } catch (error) {
    if (error.request.res.statusCode == 404) {
      this._log.debug("Man page returned 404");
      let msg = ":negative_squared_cross_mark: No manual entry for " + name;
      if (typeof section !== "undefined") {
        msg += " in section " + section;
      }
      await message.channel.stopTyping();
      return message.channel.send(msg);
    } else {
      log.warn(error);
      await message.channel.stopTyping();
      return;
    }
  }
  const data = parser.parse(res.data, {pre: true});
  const manText = data.querySelector("pre").innerHTML.split("\n");
  const fullHeader = manText[0].split(/ {2,}/);
  name = fullHeader[0].split("(")[0];
  section = fullHeader[0].match(/(?<=\()[1-9][a-z]*(?=\))/g);
  const header = fullHeader[1];
  const os = distro;
  const sections = {};
  let sectionHead = "";
  let sectionContents = "";
  let fields = 0;
  for (let i = 1; i < manText.length; i++) {
    if (manText[i].startsWith("<a href=\"#head")) { // new section
      if (sectionHead != "") { // if not empty, save
        if (!exclude.has(sectionHead)){
          this._log.debug("Adding " + sectionHead);
          sections[sectionHead] = sectionContents;
          fields++;
        }
        if (fields >= 5) {
          this._log.debug("Stopping because five fields added");
          break;
        }
      }
      sectionContents = "";
      sectionHead = manText[i].replace(/<[^>]+>/ig,"");
    } else if (manText[i].startsWith(" ")){ // add line to text
      sectionContents += manText[i]
          .replace(/></g, "> <") // split tags apart
          .replace(/<\/?b[^>]*>/ig, "**") // bold
          .replace(/<\/?i[^>]*>/ig, "*") // italic
          .replace(/<\/?a[^>]*>/ig, ""); // remove links
      sectionContents += "\n";
    } else if (manText[i] == "" && sectionHead == "DESCRIPTION") {
      this._log.debug("Adding DESCRIPTION");
      sections[sectionHead] = sectionContents;
      sectionHead = "";
      sectionContents = "";
      fields++;
    }
  }
  sections[sectionHead] = sectionContents;
  url = res.request.res.responseUrl;
  const man = {name, section, header, os, url, sections};

  await message.channel.stopTyping();
  const embed = render(man);
  this._log.debug(`Sending man page ${man.name}(${man.section}) in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return message.channel.send({embed});
}

Man.prototype.permission = ["SEND_MESSAGES"];

module.exports = Man;
