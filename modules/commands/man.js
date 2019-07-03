const Discord = require("discord.js");
const axios = require("axios");
const manned = axios.create({
  baseURL: "https://manned.org/"
});
const parser = require("node-html-parser");
const schedule = require("node-schedule");
const render = require("../render.js");
const log = require("../logger.js");

// fields to exclude
const exclude = new Set(["AUTHOR", "REPORTING BUGS", "COPYRIGHT", "SEE ALSO"]);

// field limit
const fieldLimit = 3;

const Man = function() {
  this._distros = [];
  this._updateDistros();
  schedule.scheduleJob("0 0 * * 0", async () => {this._updateDistros()});
}

Man.prototype._resolveDistro = function(distro) {
  for (let i = 0; i < this._distros.length; i++) {
    if (this._distros[i] == distro || this._distros[i].split("-")[0] == distro) {
      return this._distros[i];
    }
  }
  return undefined;
}

Man.prototype._updateDistros = async function() {
  const distributions = [];
  const manpage = await manned.get("/");
  log.debug("Retrieved Linux distribution list");
  const distroHTMLList = parser.parse(manpage.data).querySelector("#systems").innerHTML; // this part is split up for readability
  const distroList = parser.parse(distroHTMLList).querySelectorAll("a");
  for (let i = 0; i < distroList.length; i++){
    let distroName = distroList[i].attributes.href;
    if (distroName != "#"){ // href for more links
      distroName = distroName.match(/[^/]+$/g); // get substr of href after the last slash
      distributions.push(distroName[0]);
      log.debug("Found distribution " + distroName[0]);
    }
  }
  this._distros = distributions;
  log.info("Updated Linux distribution list");
  return distributions;
}

Man.prototype.execute = async function(prefix, command, args, message, client) {
  // parse args
  let distro;
  let section;
  let name;
  if (args.length < 1) { // reject things that have invalid # of arguments
    log.debug("Rejecting man command with no arguments");
    return message.channel.send(":negative_squared_cross_mark: What manual page do you want?");
  }
  let arg = 0;
  while (args.length > 0) {
    if (args.length > 1) {
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
  log.debug("Built URL is " + url);

  // fetch and parse the man page
  let res;
  try {
    res = await manned.get(url);
  } catch (error) {
    if (error.request.res.statusCode == 404) {
      log.debug("Man page returned 404");
      let msg = ":negative_squared_cross_mark: No manual entry for " + name;
      if (typeof section !== "undefined") {
        msg += " in section " + section;
      }
      return message.channel.send(msg);
    } else {
      log.warn(error);
      return;
    }
  }
  const data = parser.parse(res.data, {pre: true});
  const manText = data.querySelector("pre").innerHTML.split("\n");
  const fullHeader = manText.shift().split(/ {2,}/);
  name = fullHeader[0].split("(")[0];
  section = fullHeader[0].match(/(?<=\()[1-9][a-z]*(?=\))/g);
  const header = fullHeader[1];
  const os = distro;
  const sections = {};
  let sectionHead = "";
  let sectionContents = "";
  let fields = 0;
  for (let line of manText) {
    if (fields >= fieldLimit) {
      log.debug("Field limit reached");
      break;
    }
    if (line.startsWith("<a href=\"#head")) { // new section
      if (sectionHead != "") { // if not empty, save
        if (!exclude.has(sectionHead)){
          log.debug("Adding " + sectionHead);
          sections[sectionHead] = sectionContents;
          fields++;
        }
      }
      sectionContents = "";
      sectionHead = line.replace(/<[^>]+>/ig,"");
    } else if (line.startsWith(" ")){ // add line to text
      sectionContents += line
          .replace(/></g, "> <") // split tags apart
          .replace(/<\/?b[^>]*>/ig, "**") // bold
          .replace(/<\/?i[^>]*>/ig, "*") // italic
          .replace(/<\/?a[^>]*>/ig, ""); // remove links
      sectionContents += "\n";
    } else if (line == "" && sectionHead == "DESCRIPTION") {
      log.debug("Adding DESCRIPTION");
      sections[sectionHead] = sectionContents;
      sectionHead = "";
      sectionContents = "";
      fields++;
    }
  }
  if (fields < fieldLimit && !exclude.has(sectionHead)) {
    log.debug("Adding " + sectionHead);
    sections[sectionHead] = sectionContents;
  }
  url = res.request.res.responseUrl;
  const man = {name, section, header, os, url, sections};
  const embed = render(man);
  log.debug(`Sending man page ${man.name}(${man.section}) in guild ${message.guild.name} (${message.guild.id}) channel ${message.channel.name} (${message.channel.id})`);
  return message.channel.send({embed});
}

Man.prototype.permission = ["SEND_MESSAGES"];

module.exports = Man;
