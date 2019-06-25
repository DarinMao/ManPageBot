const Discord = require("discord.js");
const axios = require("axios");
const manned = axios.create({
  baseURL: "https://manned.org/"
});
const parser = require("node-html-parser");

const render = require("../render.js");

const fields = ["NAME", "SYNOPSIS", "DESCRIPTION", "USAGE", "OPTIONS", "PARAMETERS"];
//const fields = ["NAME", "SYNOPSIS"];

// get list of all distros currently on manned.org.  Currently just using a static list, but a dynamic approach should be implemented
const distros = ["arch", "centos-7.6", "centos-7.5", "centos-7.4", "centos-7.3", "centos-7.2", "centos-7.1", "centos-7.0", "centos-6.10", "centos-6.9", "centos-6.8", "centos-6.7", "centos-6.6", "centos-6.5", "centos-6.4", "centos-6.3", "centos-6.2", "centos-6.1", "centos-6.0", "centos-5.11", "centos-5.10", "centos-5.9", "centos-5.8", "centos-5.7", "centos-5.6", "centos-5.5", "centos-5.4", "centos-5.3", "centos-5.2", "centos-5.1", "centos-5.0", "centos-4.9", "centos-4.8", "centos-4.7", "centos-4.6", "centos-4.5", "centos-4.4", "centos-4.3", "centos-4.2", "centos-4.1", "centos-4.0", "centos-3.9", "centos-3.8", "centos-3.7", "centos-3.6", "centos-3.5", "centos-3.4", "centos-3.3", "centos-3.1", "centos-2.1", "debian-stretch", "debian-jessie", "debian-wheezy", "debian-squeeze", "debian-lenny", "debian-etch", "debian-sarge", "debian-woody", "debian-potato", "debian-slink", "debian-hamm", "debian-bo", "debian-rex", "debian-buzz", "fedora-29", "fedora-28", "fedora-27", "fedora-26", "fedora-25", "fedora-24", "fedora-23", "fedora-22", "fedora-21", "fedora-20", "fedora-19", "fedora-18", "fedora-17", "fedora-16", "fedora-15", "fedora-14", "fedora-13", "fedora-12", "fedora-11", "fedora-10", "fedora-9", "fedora-8", "fedora-7", "fedora-6", "fedora-5", "fedora-4", "fedora-3", "fedora-2", "fedora-1", "freebsd-12.0", "freebsd-11.2", "freebsd-11.1", "freebsd-11.0", "freebsd-10.4", "freebsd-10.3", "freebsd-10.2", "freebsd-10.1", "freebsd-10.0", "freebsd-9.3", "freebsd-9.2", "freebsd-9.1", "freebsd-9.0", "freebsd-8.4", "freebsd-8.3", "freebsd-8.2", "freebsd-8.1", "freebsd-8.0", "freebsd-7.4", "freebsd-7.3", "freebsd-7.2", "freebsd-7.1", "freebsd-7.0", "freebsd-6.4", "freebsd-6.3", "freebsd-6.2", "freebsd-6.1", "freebsd-6.0", "freebsd-5.5", "freebsd-5.4", "freebsd-5.3", "freebsd-5.2.1", "freebsd-5.2", "freebsd-5.1", "freebsd-5.0", "freebsd-4.11", "freebsd-4.10", "freebsd-4.9", "freebsd-4.8", "freebsd-4.7", "freebsd-4.6.2", "freebsd-4.6", "freebsd-4.5", "freebsd-4.4", "freebsd-4.3", "freebsd-4.2", "freebsd-4.1.1", "freebsd-4.1", "freebsd-4.0", "freebsd-3.5.1", "freebsd-3.5", "freebsd-3.4", "freebsd-3.3", "freebsd-3.2", "freebsd-3.1", "freebsd-3.0", "freebsd-2.2.8", "freebsd-2.2.7", "freebsd-2.2.6", "freebsd-2.2.5", "freebsd-2.2.2", "freebsd-2.1.7", "freebsd-2.1.5", "freebsd-2.0.5", "freebsd-1.0", "ubuntu-disco", "ubuntu-cosmic", "ubuntu-bionic", "ubuntu-artful", "ubuntu-zesty", "ubuntu-yakkety", "ubuntu-xenial", "ubuntu-wily", "ubuntu-vivid", "ubuntu-utopic", "ubuntu-trusty", "ubuntu-saucy", "ubuntu-raring", "ubuntu-quantal", "ubuntu-precise", "ubuntu-oneiric", "ubuntu-natty", "ubuntu-maverick", "ubuntu-lucid", "ubuntu-karmic", "ubuntu-jaunty", "ubuntu-intrepid", "ubuntu-hardy", "ubuntu-gutsy", "ubuntu-feisty", "ubuntu-edgy", "ubuntu-dapper", "ubuntu-breezy", "ubuntu-hoary", "ubuntu-warty"];

const resolveDistro = function(distro) {
  for (let i = 0; i < distros.length; i++) {
    if (distros[i] == distro || distros[i].split("-")[0] == distro) {
      return distros[i];
    }
  }
  return null;
}

const execute = async function(prefix, command, args, message, client) {
  await message.channel.startTyping();
  // parse args
  let distro = "";
  let section = 0;
  let name = "";
  if (args.length < 1) { // reject things that have invalid # of arguments
    return message.channel.send(":negative_squared_cross_mark: What manual page do you want?");
  }
  let arg = 0;
  while (args.length > 0) {
    if ((arg = parseInt(args[0])) == parseFloat(args[0])
        && (arg >= 1 && arg <= 9)) { // it is a valid section # (integer between 1 and 9)
      section = args.shift();
    } else if (resolveDistro(args[0]) != null) { // it is a valid distro
      distro = resolveDistro(args.shift());
    } else { // it's the command and also the last arg
      name = args.shift();
      break;
    }
  }

  // build URL
  let url = "/";
  if (distro != "") {
    url += "man/" + distro + "/";
  }
  url += name;
  if (section != 0) {
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
  const header = manText[0].split(/ {2,}/);
  name = header[0].split("(")[0];
  section = header[0].match(/(?<=\()[1-9][a-z]*(?=\))/g);
  const sectionName = header[1];
  const os = distro;
  const sections = {};
  let sectionHead = "";
  let sectionContents = "";
  for (let i = 1; i < manText.length; i++) {
    if (manText[i] == "") { // skip the empty lines
      continue;
    }
    if (manText[i].startsWith("<a href=\"#head")) { // new section
      if (sectionHead != "") { // if not empty, save
        sections[sectionHead] = sectionContents;
        sectionContents = "";
      }
      sectionHead = manText[i].replace(/<[^>]+>/ig,"");
    } else { // add line to text
      sectionContents += manText[i]
          .replace(/<\/?b[^>]*>/ig, "**") // bold
          .replace(/<\/?i[^>]*>/ig, "*") // italic
          .replace(/<\/?a[^>]*>/ig, ""); // remove links
      sectionContents += "\n";
    }
  }
  sections[sectionHead] = sectionContents;
  url = res.request.res.responseUrl;
  const man = {name, section, sectionName, os, url, sections};

  await message.channel.stopTyping();
  const embed = render(man, fields);
  return message.channel.send({embed});
}

const permission = ["SEND_MESSAGES"];

module.exports = {execute, permission};
