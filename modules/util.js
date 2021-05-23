"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randInt = exports.parseMention = exports.parseCommand = exports.getDateString = void 0;
const config_1 = require("../config");
const { prefix } = config_1.default;
function getDateString(date) {
    return date.toLocaleString('en-CA', { timeZone: 'America/Toronto' });
}
exports.getDateString = getDateString;
function parseCommand(s) {
    s = s.trim();
    if (s.startsWith(prefix)) {
        s = s.substring(prefix.length).trim();
    }
    return s.split(' ');
}
exports.parseCommand = parseCommand;
function parseMention(s) {
    return s.substring(2, s.length - 1);
}
exports.parseMention = parseMention;
function randInt(low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
}
exports.randInt = randInt;
//# sourceMappingURL=util.js.map