const storage = require("node-persist");

function Prefix() {
  this.prefixes = {};
}

Prefix.prototype.init = async function() {
  await storage.init();
  let keys = await storage.keys();
  for (let i = 0; i < keys.length; i++) {
    this.prefixes[keys[i]] = await storage.getItem(keys[i]);
  }
}

Prefix.prototype.get = function(id) {
  if (id in this.prefixes) {
    return this.prefixes[id];
  }
  return null;
}

Prefix.prototype.set = async function(id, prefix) {
  this.prefixes[id] = prefix;
  await storage.setItem(id, prefix);
}

Prefix.prototype.remove = async function(id) {
  delete this.prefixes[id];
  await storage.removeItem(id);
}

module.exports = Prefix;
