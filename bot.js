"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = require("discord.js");
const pkg = require("./package.json");
const config_js_1 = require("./config.js");
const { DATA_CHANNEL_ID, prefix, IGNORE_BOTS, } = config_js_1.default;
const actionsTroll = require("./modules/actions_troll.js");
const commands = require("./modules/commands.js");
const db = require("./modules/database.js");
const reactions_js_1 = require("./modules/reactions.js");
const solves = require("./modules/solves.js");
const timer = require("./modules/timer.js");
const bot = new Discord.Client();
bot.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    bot.user.setActivity(`type '${prefix} help' for help`);
    yield actionsTroll.loadJokes();
    let dataChannel = (yield bot.channels.fetch(DATA_CHANNEL_ID));
    yield db.loadSolves(dataChannel);
    console.log(`${pkg.name}, v${pkg.version} is now up and running.`);
}));
function checkTimer(message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (timer.hasTimer(message.author.id, message.channel.id)) {
            let time = yield timer.stopTimer(message);
            let hadScramble = true;
            if (time < 0) {
                time = -time;
                hadScramble = false;
            }
            let s = `Timer stopped for ${message.author.username}. **${timer.formatTime(time, false)}**`;
            if (!hadScramble) {
                s += '\nTo track your solves, generate a scramble using `cube get` and'
                    + ' react to it. Then, your next time will be logged on your profile.';
            }
            else if (solves.getSolver(message.author.id).lastSolveWasPb()) {
                s += `\nThat is a new personal best. Congratulations!`;
            }
            message.channel.send(s);
        }
    });
}
bot.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = message.author.id;
    if (userId == bot.user.id || (message.author.bot && IGNORE_BOTS)) {
        return;
    }
    if (message.channel.id == DATA_CHANNEL_ID) {
        message.delete({ reason: 'not supposed to send messages in the data channel' });
        return;
    }
    yield actionsTroll.handleTroll(message);
    yield checkTimer(message);
    yield commands.handleCommand(message);
}));
bot.on('messageReactionAdd', (messageReaction, user) => __awaiter(void 0, void 0, void 0, function* () {
    if (messageReaction.message.author.id != bot.user.id) {
        return;
    }
    if (user.id == bot.user.id || (user.bot && IGNORE_BOTS)) {
        return;
    }
    for (const raa of reactions_js_1.REACTION_ADD_ACTIONS) {
        if (messageReaction.emoji.name == raa.emoji && raa.appliesTo(messageReaction.message)) {
            raa.do(messageReaction, user);
        }
    }
}));
bot.on('messageReactionRemove', (messageReaction, user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.id == bot.user.id || (user.bot && IGNORE_BOTS)) {
        return;
    }
    if (messageReaction.emoji.name == reactions_js_1.REACTION_ADD_ACTIONS[0].emoji) {
        reactions_js_1.REACTION_ADD_ACTIONS[1].do(messageReaction, user);
    }
}));
require('dotenv').config();
bot.login(process.env.TOKEN);
//# sourceMappingURL=bot.js.map