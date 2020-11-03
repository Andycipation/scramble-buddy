/*
A bunch of utility methods.
*/


/**
 * Returns a random integer in the range [low, high].
 * @param {Number} low the lower bound
 * @param {Number} high the upper bound
 */
function randInt(low, high) {
  return low + Math.floor(Math.random() * (high - low + 1));
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


exports.randInt = randInt;
exports.parseMention = parseMention;
