/*
Module to manage all actions related to timing.
*/


const Discord = require('discord.js');

const db = require('./database.js');


/**
 * Returns a formatted string for the given solve result.
 * @param {number} milliseconds the time to format in milliseconds
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


const startTimes = new Map();  // map<userId, map<channelId, startTime>>
const curScramble = new Map();  // map from user id to scramble string

/**
 * Starts a timer for a user in a channel.
 * @param {string} userId the id of the user to start a timer for
 * @param {string} channelId the channel the timer is bound to
 */
function startTimer(userId, channelId) {
  if (!startTimes.has(userId)) {
    startTimes.set(userId, new Map());
  }
  startTimes.get(userId).set(channelId, Date.now());
}

/**
 * Returns whether there is a timer for a user in a channel.
 * @param {string} userId the id of the user to check
 * @param {string} channelId the id of the channel to check
 * @returns {boolean} whether there is a timer with the given parameters
 */
function hasTimer(userId, channelId) {
  return (startTimes.has(userId) && startTimes.get(userId).has(channelId));
}

/**
 * Stops the timer and returns the solve time of the user. If a scramble was
 * selected, logs the solve in the database.
 * @param {Discord.User} user the user to check
 * @param {Discord.Channel} channel the channel to check
 * @returns {Promise<number>} the solve time, or its negative if no scramble was selected
 */
async function _stopTimer(user, channel) {
  if (!hasTimer(user.id, channel.id)) {
    return null;
  }
  const time = Date.now() - startTimes.get(user.id).get(channel.id);
  startTimes.get(user.id).delete(channel.id);
  if (!curScramble.has(user.id)) {
    return -time;  // nothing to log or delete
  }
  await db.logSolve(user.id, time, curScramble.get(user.id));
  curScramble.delete(user.id);
  return time;
}

/**
 * Stops the timer and returns the solve time of the user. If a scramble was
 * selected, logs the solve in the database.
 * @param {Discord.Message} message the message to check
 * @returns {Promise<number>} the solve time, or its negative if no scramble was selected
 */
async function stopTimer(message) {
  return _stopTimer(message.author, message.channel);
}

function setScramble(userId, scrambleString) {
  curScramble.set(userId, scrambleString);
}

function deleteScramble(userId) {
  return curScramble.delete(userId);
}


exports.formatTime = formatTime;
exports.hasTimer = hasTimer;
exports.startTimer = startTimer;
exports.stopTimer = stopTimer;
exports.setScramble = setScramble;
exports.deleteScramble = deleteScramble;
