/*
Settings and parameters for the bot.
*/

import pkg = require("./package.json");

const config = {
  BOT_NAME: "ScrambleBuddy",

  MY_DISCORD_ID: "199904392504147968",
  DATA_CHANNEL_ID: "739940657010835506",
  CCG_GUILD_ID: "694345248163233832",

  // the number of messages to fetch from the data channel
  LOGS_TO_LOAD: 100000,

  LEADERBOARD_LENGTH: 10,

  prefix: "cube",
  troll: true,
  IGNORE_BOTS: true,
  COOLDOWN: 0, // in milliseconds

  // whether or not to attach images of the scramble net
  MAKE_SCRAMBLE_IMAGES: true,

  // for getting a scramble
  CONFIRM_EMOJI: "✅",
  REMOVE_EMOJI: "❌",
  SCRAMBLE_REACT_PROMPT: `React with ✅ to use this scramble.`,

  // profile embed information
  FIRST_EMOJI: "⏮️",
  LEFT_EMOJI: "◀️",
  REFRESH_EMOJI: "🔃",
  RIGHT_EMOJI: "▶️",
  LAST_EMOJI: "⏭️",
  SOLVES_PER_PAGE: 10, // number of solves per page for profile embeds

  FOOTER_STRING: `ScrambleBuddy, v${pkg.version} | Trademark ${pkg.author}™`,
};

export default config;
