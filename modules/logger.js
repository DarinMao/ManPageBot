// log
const log = require("simple-node-logger").createSimpleLogger();
if (process.env.NODE_ENV == "dev") {
    log.setLevel("debug");
}

module.exports = log;
