"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pkg = require('./package.json');
const config = {
    BOT_NAME: 'ScrambleBuddy',
    MY_DISCORD_ID: '199904392504147968',
    DATA_CHANNEL_ID: '739940657010835506',
    CCG_GUILD_ID: '694345248163233832',
    LOGS_TO_LOAD: 100000,
    LEADERBOARD_LENGTH: 10,
    prefix: 'cube',
    troll: true,
    IGNORE_BOTS: true,
    COOLDOWN: 0,
    MAKE_SCRAMBLE_IMAGES: true,
    CONFIRM_EMOJI: '✅',
    REMOVE_EMOJI: '❌',
    SCRAMBLE_REACT_PROMPT: `React with ✅ to use this scramble.`,
    FIRST_EMOJI: '⏮️',
    LEFT_EMOJI: '◀️',
    REFRESH_EMOJI: '🔃',
    RIGHT_EMOJI: '▶️',
    LAST_EMOJI: '⏭️',
    SOLVES_PER_PAGE: 10,
    FOOTER_STRING: `ScrambleBuddy, v${pkg.version} | Trademark ${pkg.author}™`,
};
exports.default = config;
//# sourceMappingURL=config.js.map