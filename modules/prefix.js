const storage = require("node-persist");

const prefixes = [];

const init = async function() {
  await storage.init();
  const keys = await storage.keys();
  for (let i = 0; i < keys.length; i++) {
    prefixes[keys[i]] = await storage.getItem(keys[i]);
  }
  return prefixes;
}

const get = function(id) {
  if (id in prefixes) {
    return prefixes[id];
  }
  return null;
}

const set = async function(id, prefix) {
  prefixes[id] = prefix;
  return storage.setItem(id, prefix);
}

const remove = async function(id) {
  delete prefixes[id];
  return storage.removeItem(id);
}

module.exports = {init, get, set, remove};
