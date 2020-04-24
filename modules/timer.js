/*
Module to manage all actions related to timing.
*/

const solves = require('./solves.js');

function formatTime(milliseconds) {
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
  return res;
}

var timers = new Map(); // map<userId, map<channelId, startTime>>
var curScramble = new Map(); // map from user id to scramble string

function startTimer(userId, channelId) {
  if (!timers.has(userId)) {
    timers.set(userId, new Map());
  }
  timers.get(userId).set(channelId, Date.now());
}

function _hasTimer(userId, channelId) {
  return (timers.has(userId) && timers.get(userId).has(channelId));
}

function _checkStop(channel, user) {
  if (!_hasTimer(user.id, channel.id)) {
    return; // this user doesn't have a timer in this channel
  }
  let time = Date.now() - timers.get(user.id).get(channel.id);
  timers.get(user.id).delete(channel.id);
  channel.send(`Timer stopped for ${user.username}; time: ${formatTime(time)}`);
  if (!curScramble.has(user.id)) {
    return; // if user didn't request a scramble, don't consider this for PB
  }
  if (solves.updatePb(user.id, time, curScramble.get(user.id))) {
    channel.send(`${user.username} got a new personal best of`
      + ` ${formatTime(time)}. Congratulations!`);
  }
  curScramble.delete(user.id);
}

function checkStop(message) {
  _checkStop(message.channel, message.author);
}


exports.formatTime = formatTime;
exports.startTimer = startTimer;
exports.checkStop = checkStop;
exports.curScramble = curScramble; // private this later
