const Discord = require("discord.js");
const axios = require("axios");
const manned = axios.create({
  baseURL: "https://manned.org/"
});

const mainIndex = require("../../index.js");
const parser = require("node-html-parser");
const schedule = require("node-schedule");
const render = require("../render.js");
//console.log(mainIndex.updateDistros());
// get list of all distros currently on manned.org.  Currently just using a static list, but a dynamic approach should be implemented
let distros = [];
const resolveDistro = function(distro) {
  for (let i = 0; i < distros.length; i++) {
    if (distros[i] == distro || distros[i].split("-")[0] == distro) {
      return distros[i];
    }
  }
  return undefined;
}

const execute = async function(prefix, command, args, message, client) {
  await message.channel.startTyping();
  // parse args
  let distro;
  let section;
  let name;
  if (args.length < 1) { // reject things that have invalid # of arguments
    return message.channel.send(":negative_squared_cross_mark: What manual page do you want?");
  }
  let arg = 0;
  while (args.length > 0) {
    if(args.length > 1){
      if ((arg = parseInt(args[0])) == parseFloat(args[0])
          && (arg >= 1 && arg <= 9)) { // it is a valid section # (integer between 1 and 9)
        section = args.shift();
      } else if (typeof (distro = resolveDistro(args[0])) !== "undefined") { // it is a valid distro
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

  // fetch and parse the man page
  let res;
  try {
    res = await manned.get(url);
  } catch (error) {
    if (error.request.res.statusCode == 404) {
      let msg = ":negative_squared_cross_mark: No manual entry for " + name;
      if (section != 0) {
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
  const fields = [];
  for (let i = 1; i < manText.length; i++) {
    if (manText[i] == "") { // skip the empty lines
      continue;
    }
    if (manText[i].startsWith("<a href=\"#head")) { // new section
      if (sectionHead != "") { // if not empty, save
        if(sectionHead == "DESCRIPTION"){ //only get first paragraph of description
          sections[sectionHead] = sectionContents.split('.\n')[0].replace('\n','') + "."; //split it at periods with a new line and remove any existing newlines.  Add the period back.
        } else {
          sections[sectionHead] = sectionContents;
        }
        sectionContents = "";
      }
      sectionHead = manText[i].replace(/<[^>]+>/ig,"");
      if(fields.length < 5 && sectionHead != "AUTHOR" && sectionHead != "REPORTING BUGS" && sectionHead != "COPYRIGHT" && sectionHead != "SEE ALSO"){
        fields.push(sectionHead);
      }
    } else if (manText[i].startsWith(" ")){ // add line to text
      sectionContents += manText[i]
          .replace(/></g, "> <") // split tags apart
          .replace(/<\/?b[^>]*>/ig, "**") // bold
          .replace(/<\/?i[^>]*>/ig, "*") // italic
          .replace(/<\/?a[^>]*>/ig, ""); // remove links
      sectionContents += "\n";
    }
  }
  sections[sectionHead] = sectionContents;
  url = res.request.res.responseUrl;
  const man = {name, section, header, os, url, sections};

  await message.channel.stopTyping();
  const embed = render(man, fields);
  return message.channel.send({embed});
}

const permission = ["SEND_MESSAGES"];

module.exports = {execute, permission};

//scheduling periodic updates to the list
const j = schedule.scheduleJob('0 0 * * 0', updateDistros().then(distroRun => {
  console.log("distro list updated");
  updateDistrosValue(distroRun);
}));

//function for updating distro list
async function updateDistros(){
  const distributions = new Array();
  const manpage = await axios.get("https://manned.org");
  const distroHTMLList = parser.parse(manpage.data).querySelector('#systems').innerHTML; //This part is split up for readability
  const distroList = parser.parse(distroHTMLList).querySelectorAll('a');
  for(let i = 0; i < distroList.length; i++){
      let distroName = distroList[i].attributes.href;
      if(distroName != "#"){ //href for more links
        distroName = distroName.match(/[^/]+$/g); //get substr of href after the last slash
        distributions.push(distroName[0]);
      }
  }
  return distributions;
}

function updateDistrosValue(arr){
  distros = arr;
}
