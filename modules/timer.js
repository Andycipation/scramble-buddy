"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScramble = exports.setScramble = exports.stopTimer = exports._stopTimer = exports.hasTimer = exports.startTimer = exports.formatTime = void 0;
const db = require("./database.js");
function formatTime(milliseconds, plusTwo) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let res = '';
    if (hours > 0) {
        res += hours + ":";
    }
    if (minutes > 0) {
        minutes %= 60;
        let minString = minutes.toString();
        if (hours > 0) {
            minString = minString.padStart(2, '0');
        }
        res += minString + ':';
    }
    seconds %= 60;
    let secString = seconds.toString();
    if (minutes > 0) {
        secString = secString.padStart(2, '0');
    }
    milliseconds %= 1000;
    res += secString + '.' + milliseconds.toString().padStart(3, '0');
    if (plusTwo) {
        res += '+';
    }
    return res;
}
exports.formatTime = formatTime;
const startTimes = new Map();
const curScramble = new Map();
function startTimer(userId, channelId) {
    if (!startTimes.has(userId)) {
        startTimes.set(userId, new Map());
    }
    startTimes.get(userId).set(channelId, Date.now());
}
exports.startTimer = startTimer;
function hasTimer(userId, channelId) {
    return (startTimes.has(userId) && startTimes.get(userId).has(channelId));
}
exports.hasTimer = hasTimer;
function _stopTimer(user, channel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!hasTimer(user.id, channel.id)) {
            return null;
        }
        const time = Date.now() - startTimes.get(user.id).get(channel.id);
        startTimes.get(user.id).delete(channel.id);
        if (!curScramble.has(user.id)) {
            return -time;
        }
        yield db.logSolve(user.id, time, curScramble.get(user.id));
        curScramble.delete(user.id);
        return time;
    });
}
exports._stopTimer = _stopTimer;
function stopTimer(message) {
    return __awaiter(this, void 0, void 0, function* () {
        return _stopTimer(message.author, message.channel);
    });
}
exports.stopTimer = stopTimer;
function setScramble(userId, scrambleString) {
    curScramble.set(userId, scrambleString);
}
exports.setScramble = setScramble;
function deleteScramble(userId) {
    return curScramble.delete(userId);
}
exports.deleteScramble = deleteScramble;
//# sourceMappingURL=timer.js.map