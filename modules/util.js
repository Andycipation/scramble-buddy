/*
A bunch of utility methods.
*/


const { prefix } = require('../config.js');


/**
 * Returns the arguments of the given command.
 * @param {string} s the command to parse
 */
function parseCommand(s) {
  s = s.trim();
  if (s.startsWith(prefix)) {
    s = s.substring(prefix.length).trim();
  }
  return s.split(' ');
}

/**
 * Converts a string of the form <@(id)> to id, e.g.
 * <@199904392504147968> becomes 199904392504147968.
 * @param {string} s the mention string to convert
 * @returns {string} the user id in the given string
 */
function parseMention(s) {
  return s.substring(2, s.length - 1);
}

/**
 * Returns a random integer in the range [low, high].
 * @param {Number} low the lower bound
 * @param {Number} high the upper bound
 */
function randInt(low, high) {
  return low + Math.floor(Math.random() * (high - low + 1));
}


exports.parseCommand = parseCommand;
exports.parseMention = parseMention;
exports.randInt = randInt;
