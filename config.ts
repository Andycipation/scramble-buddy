/*
Settings and parameters for the bot.

Probably don't put in a json or yaml file since some of
these values are dynamic?
*/

import pkg from "./package.json";

import dotenv from "dotenv";
dotenv.config();

console.log("NODE_ENV: ", process.env.NODE_ENV);

const config = {
  BOT_NAME: "ScrambleBuddy",
  AUTH_TOKEN: process.env.TOKEN,

  MY_DISCORD_ID: "199904392504147968",
  DATA_CHANNEL_ID: "739940657010835506", // #scramblebuddy-log
  CCG_GUILD_ID: "694345248163233832", // Corona Cuber Gang server

  // the maximum number of messages to fetch from the data channel
  // massive hack for debugging
  LOGS_TO_LOAD: parseInt(process.env.DEBUG_LOGS_TO_LOAD || "1000000", 10),

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
