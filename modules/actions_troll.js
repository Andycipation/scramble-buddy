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
exports.handleTroll = exports.loadJokes = void 0;
const config_1 = require("../config");
const util_js_1 = require("./util.js");
const fs = require("fs");
const JOKE_FILE = './jokes.txt';
const JOKES = [];
function loadJokes() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('loading jokes');
        fs.readFile(JOKE_FILE, (error, data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.length > 0) {
                    JOKES.push(line);
                }
            }
        });
    });
}
exports.loadJokes = loadJokes;
function handleTroll(message) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (message.author.id == config_1.default.MY_DISCORD_ID) {
            const args = util_js_1.parseCommand(message.content);
            const op = args[0];
            if (op == 'toggletroll') {
                config_1.default.troll = !config_1.default.troll;
                message.channel.send(`Troll messages ${config_1.default.troll ? 'enabled' : 'disabled'}.`);
            }
        }
        if (!config_1.default.troll) {
            return;
        }
        if (message.content == 'Hi!') {
            message.channel.send('Hi!');
        }
        if (message.content == 'gn') {
            message.channel.send('Good night!');
        }
        if (message.content.toLowerCase().startsWith('vc tmr?')) {
            message.channel.send('vc tmr.');
        }
        if (message.content.toLowerCase().startsWith('vc tn?')) {
            message.channel.send('vc tn.');
        }
        if (message.content.toLowerCase().startsWith('vc rn?')) {
            message.channel.send('vc rn.');
        }
        if (((_a = message.guild) === null || _a === void 0 ? void 0 : _a.id) == config_1.default.CCG_GUILD_ID) {
            if (message.content.toLowerCase().includes('joke')) {
                const joke = JOKES[util_js_1.randInt(0, JOKES.length - 1)];
                message.channel.send('Did someone say "joke"? Well, here\'s one: ```' + joke + '```');
            }
        }
    });
}
exports.handleTroll = handleTroll;
//# sourceMappingURL=actions_troll.js.map