/*
Module to manage all actions related to timing.
*/


const db = require('./database.js');
const solves = require('./solves.js');


/**
 * Returns a formatted string for the given solve result.
 * @param {Number} milliseconds the time to format in milliseconds
 * @param {boolean} plusTwo whether the solve was a +2
 * @returns {string} the formatted time
 */
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


const startTimes = new Map(); // map<userId, map<channelId, startTime>>
const curScramble = new Map(); // map from user id to scramble string

function startTimer(userId, channelId) {
  if (!startTimes.has(userId)) {
    startTimes.set(userId, new Map());
  }
  startTimes.get(userId).set(channelId, Date.now());
}

function _hasTimer(userId, channelId) {
  return (startTimes.has(userId) && startTimes.get(userId).has(channelId));
}

async function _checkStop(channel, user) {
  if (!_hasTimer(user.id, channel.id)) {
    return;  // this user doesn't have a timer in this channel
  }
  let time = Date.now() - startTimes.get(user.id).get(channel.id);
  startTimes.get(user.id).delete(channel.id);
  let s = `Timer stopped for ${user.username}; time: ${formatTime(time)}`;
  if (!curScramble.has(user.id)) {
    // TODO: change `cubeget` to reference modules/commands.js
    s += '\nTo track your solves, generate a scramble using `cubeget` and'
      + ' react to it. Then, your next time will be logged.';
    channel.send(s);
    return;  // if user didn't request a scramble, don't consider this for PB
  }
  channel.send(s);
  // add the solve to this user's Solver object
  await db.logSolve(user.id, time, curScramble.get(user.id));
  if (solves.getSolver(user.id).lastSolveWasPb()) {
    // this SolveEntry that was just added was a personal best
    channel.send(`${user.username} got a new personal best of`
      + ` ${formatTime(time)}. Congratulations!`);
  }
  curScramble.delete(user.id);
}

function checkStop(message) {
  _checkStop(message.channel, message.author);
}

function setScramble(userId, scrambleString) {
  curScramble.set(userId, scrambleString);
}

function deleteScramble(userId) {
  return curScramble.delete(userId);
}


exports.formatTime = formatTime;
exports.startTimer = startTimer;
exports.checkStop = checkStop;
exports.setScramble = setScramble;
exports.deleteScramble = deleteScramble;
