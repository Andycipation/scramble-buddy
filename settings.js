/*
Settings for the bot.
*/

const pkg = require('./package.json');

var prefix = 'cube'; // might add changeable prefixes later
const troll = false;
const ignoreBots = true;
const COOLDOWN = 1000;

const scrambleConfirmEmoji = '✅';
const scrambleRemoveEmoji = '❌';

const FOOTER_STRING = `${pkg.name}, version ${pkg.version} | Trademark ${pkg.author}™`

exports.prefix = prefix;
exports.troll = troll;
exports.ignoreBots = ignoreBots;
exports.COOLDOWN = COOLDOWN;

exports.scrambleConfirmEmoji = scrambleConfirmEmoji;
exports.scrambleRemoveEmoji = scrambleRemoveEmoji;

// need to find a better way lol
