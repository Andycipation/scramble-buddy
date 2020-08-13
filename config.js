/*
Settings and parameters for the bot.
*/


const pkg = require('./package.json');

const MY_DISCORD_ID = '199904392504147968';
const DATA_CHANNEL_ID = '739940657010835506';

const LEADERBOARD_LENGTH = 10;  // number of people on the leaderboard

var prefix = 'cube';  // might add changeable prefixes later
var troll = true;
const ignoreBots = true;
const COOLDOWN = 0;

const CONFIRM_EMOJI = '✅';
const REMOVE_EMOJI = '❌';
const SCRAMBLE_REACT_PROMPT = `React with ${CONFIRM_EMOJI} to use this scramble.`;

const LEFT_EMOJI = '⬅️';
const RIGHT_EMOJI = '➡️';
const SOLVES_PER_PAGE = 10;  // number of solves per page for profile embeds

const FOOTER_STRING = `${pkg.name}, version ${pkg.version} | Trademark ${pkg.author}™`


// all exports; need to find a better way lol

exports.MY_DISCORD_ID = MY_DISCORD_ID;
exports.DATA_CHANNEL_ID = DATA_CHANNEL_ID;

exports.LEADERBOARD_LENGTH = LEADERBOARD_LENGTH;

exports.prefix = prefix;
exports.troll = troll;
exports.ignoreBots = ignoreBots;
exports.COOLDOWN = COOLDOWN;

exports.CONFIRM_EMOJI = CONFIRM_EMOJI;
exports.REMOVE_EMOJI = REMOVE_EMOJI;
exports.SCRAMBLE_REACT_PROMPT = SCRAMBLE_REACT_PROMPT;

exports.LEFT_EMOJI = LEFT_EMOJI;
exports.RIGHT_EMOJI = RIGHT_EMOJI;
exports.SOLVES_PER_PAGE = SOLVES_PER_PAGE;

exports.FOOTER_STRING = FOOTER_STRING;
