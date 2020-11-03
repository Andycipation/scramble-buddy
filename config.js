/*
Settings and parameters for the bot.
*/


const pkg = require('./package.json');

module.exports = {
  BOT_NAME: 'ScrambleBuddy',

  MY_DISCORD_ID: '199904392504147968',
  DATA_CHANNEL_ID: '739940657010835506',
  CCG_GUILD_ID: '694345248163233832',

  LEADERBOARD_LENGTH: 10,

  prefix: 'cube',
  troll: true,
  IGNORE_BOTS: true,
  COOLDOWN: 0,

  CONFIRM_EMOJI: '✅',
  REMOVE_EMOJI: '❌',
  SCRAMBLE_REACT_PROMPT: `React with ✅ to use this scramble.`,

  FIRST_EMOJI: '⏮️',
  LEFT_EMOJI: '◀️',
  REFRESH_EMOJI: '🔄',
  RIGHT_EMOJI: '▶️',
  LAST_EMOJI: '⏭️',
  SOLVES_PER_PAGE: 10,  // number of solves per page for profile embeds

  FOOTER_STRING: `ScrambleBuddy, v${pkg.version} | Trademark ${pkg.author}™`,
};
