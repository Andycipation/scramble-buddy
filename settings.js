/*
Settings and parameters for the bot.
*/

const pkg = require('./package.json');

const MY_DISCORD_ID = '199904392504147968';
const DATA_CHANNEL_ID = '739940657010835506';

var prefix = 'cube'; // might add changeable prefixes later
var troll = true;
const ignoreBots = true;
const COOLDOWN = 0;

const scrambleConfirmEmoji = '✅';
const scrambleRemoveEmoji = '❌';

const FOOTER_STRING = `${pkg.name}, version ${pkg.version} | Trademark ${pkg.author}™`

exports.MY_DISCORD_ID = MY_DISCORD_ID;
exports.DATA_CHANNEL_ID = DATA_CHANNEL_ID;

exports.prefix = prefix;
exports.troll = troll;
exports.ignoreBots = ignoreBots;
exports.COOLDOWN = COOLDOWN;

exports.scrambleConfirmEmoji = scrambleConfirmEmoji;
exports.scrambleRemoveEmoji = scrambleRemoveEmoji;

exports.FOOTER_STRING = FOOTER_STRING;

// need to find a better way lol
