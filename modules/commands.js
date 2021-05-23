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
exports.handleCommand = void 0;
const config_1 = require("../config");
const { MAKE_SCRAMBLE_IMAGES } = config_1.default;
const pkg = require("../package.json");
const fs = require("fs");
const db = require("./database.js");
const scramble_js_1 = require("./scramble.js");
const solves = require("./solves.js");
const timer = require("./timer.js");
const util_js_1 = require("./util.js");
const assert = require("assert");
class Command {
    constructor(name, helpMsg, callback) {
        this.name = name;
        this.helpMsg = helpMsg;
        this.do = callback;
    }
    get helpString() {
        return `\`${config_1.default.prefix} ${this.name}\` ${this.helpMsg}`;
    }
}
const COMMANDS = new Map();
function newCommand(name, helpMsg, callback) {
    COMMANDS.set(name, new Command(name, helpMsg, callback));
}
newCommand('help', 'shows this help message', message => {
    message.channel.send({ embed: getHelpEmbed() });
});
const inSolveMode = new Set([config_1.default.MY_DISCORD_ID]);
newCommand('solvemode', 'enters solve mode (no prefix required to call commands)', message => {
    inSolveMode.add(message.author.id);
    message.channel.send(`${message.author.username}, you no longer need `
        + `the prefix \`${config_1.default.prefix}\` to call ${config_1.default.BOT_NAME} commands.`);
});
newCommand('exitsolvemode', 'exits solve mode', message => {
    inSolveMode.delete(message.author.id);
    message.channel.send(`${message.author.username}, you now need `
        + `the prefix \`${config_1.default.prefix}\` to call ${config_1.default.BOT_NAME} commands.`);
});
newCommand('get', 'generates a new scramble', (message) => __awaiter(void 0, void 0, void 0, function* () {
    const filename = `./assets/${message.id}.png`;
    const scramble = yield scramble_js_1.getScramble(filename);
    timer.setScramble(message.author.id, scramble);
    const str = `${scramble}\n`
        + `${config_1.default.SCRAMBLE_REACT_PROMPT}\n`
        + `Contenders:\n`
        + `<@${message.author.id}>`;
    const options = {};
    if (MAKE_SCRAMBLE_IMAGES) {
        options['files'] = [filename];
    }
    setTimeout(() => {
        message.channel.send(str, options).then((sent) => __awaiter(void 0, void 0, void 0, function* () {
            yield sent.react(config_1.default.CONFIRM_EMOJI);
            yield sent.react(config_1.default.REMOVE_EMOJI);
            if (MAKE_SCRAMBLE_IMAGES) {
                fs.unlinkSync(filename);
            }
        }));
    }, 100);
}));
const inspecting = new Map();
const NOTIFICATIONS = [8, 12];
const WARNINGS = [15, 17];
newCommand('inspect', 'begins your inspection timer', (message) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = message.author.id;
    const username = message.author.username;
    if (inspecting.has(userId)) {
        message.reply('You currently have an inspecting timer running.');
        return;
    }
    const startTime = Date.now();
    inspecting.set(userId, startTime);
    message.reply('Your inspection timer has begun. You have 15 seconds.');
    for (const s of NOTIFICATIONS) {
        setTimeout(() => {
            if (inspecting.get(userId) == startTime) {
                message.channel.send(`${username}, ${s} seconds have gone by.`);
            }
        }, s * 1000);
    }
    for (const s of WARNINGS) {
        setTimeout(() => {
            if (inspecting.get(userId) == startTime) {
                message.channel.send(`${username}, you have used ${s} seconds of inspection!`);
            }
        }, s * 1000);
    }
}));
newCommand('go', 'starts a timer for you', message => {
    const userId = message.author.id;
    let reply = '';
    if (inspecting.has(userId)) {
        const startTime = inspecting.get(userId);
        inspecting.delete(userId);
        const inspectionTime = Date.now() - startTime;
        reply += `Your inspection time was ${timer.formatTime(inspectionTime, false)}. `;
    }
    reply += 'Your timer has started. Send anything to stop.';
    timer.startTimer(message.author.id, message.channel.id);
    message.reply(reply);
});
newCommand('view', '`[user mention] [page]` shows user profile', message => {
    let user = message.mentions.users.first();
    if (user != null && user.bot) {
        message.channel.send("You cannot request to view a bot's solves.");
        return;
    }
    if (user == null) {
        user = message.author;
    }
    let args = util_js_1.parseCommand(message.content);
    let page = 0;
    for (let j = 1; j <= 2; ++j) {
        let x = parseInt(args[j], 10);
        if (!isNaN(x)) {
            page = x - 1;
            break;
        }
    }
    const embed = solves.getSolverEmbed(user.id, page);
    if (embed === null) {
        message.channel.send(`Invalid page number provided.`);
        return;
    }
    message.channel.send({ embed: embed }).then((sent) => __awaiter(void 0, void 0, void 0, function* () {
        yield sent.react(config_1.default.FIRST_EMOJI);
        yield sent.react(config_1.default.LEFT_EMOJI);
        yield sent.react(config_1.default.REFRESH_EMOJI);
        yield sent.react(config_1.default.RIGHT_EMOJI);
        yield sent.react(config_1.default.LAST_EMOJI);
    }));
});
newCommand('viewsolve', "`[user mention] [solve number]` view user's solve", (message) => __awaiter(void 0, void 0, void 0, function* () {
    let user = message.mentions.users.first();
    if (user != null && user.bot) {
        message.channel.send("You cannot request to view a bot's solves.");
        return;
    }
    if (user == null) {
        user = message.author;
    }
    const solver = solves.getSolver(user.id);
    if (solver.solves.empty()) {
        message.channel.send(`${user.username} does not yet have an existing solve.`);
        return;
    }
    let solve = solver.solves.size() - 1;
    let args = util_js_1.parseCommand(message.content);
    for (let j = 1; j <= 2; ++j) {
        let x = parseInt(args[j], 10);
        if (!isNaN(x)) {
            solve = x - 1;
            break;
        }
    }
    if (solve < 0 || solve >= solver.solves.size()) {
        message.channel.send(`Invalid solve number provided: ${solve + 1}`);
        return;
    }
    const se = solver.solves.at(solve);
    const str = `**Details for solve ${solve + 1} of ${user.username}**\n`
        + `${se.toString()}\n`
        + `Time the solve was completed: ${util_js_1.getDateString(se.completed)}`;
    const filename = `./assets/${message.id}.png`;
    scramble_js_1.makeImage(se.scramble, filename);
    const options = {};
    if (MAKE_SCRAMBLE_IMAGES) {
        options['files'] = [filename];
    }
    setTimeout(() => {
        message.channel.send(str, options).then((sent) => __awaiter(void 0, void 0, void 0, function* () {
            if (MAKE_SCRAMBLE_IMAGES) {
                fs.unlinkSync(filename);
            }
        }));
    }, 100);
}));
newCommand('setmethod', '`[method]` sets your solving method in your profile', (message) => __awaiter(void 0, void 0, void 0, function* () {
    const args = util_js_1.parseCommand(message.content);
    const method = args.slice(1).join(' ');
    if (method.length == 0) {
        message.channel.send(message.author.username
            + ', you must provide a solving method, e.g. `cube setmethod CFOP`.');
        return;
    }
    if (yield db.setMethod(message.author.id, method)) {
        message.channel.send(`${message.author.username}, your solving method has been set to ${method}.`);
    }
    else {
        message.channel.send('Invalid method provided; solving method unchanged.');
    }
}));
newCommand('remove', 'removes your last solve', message => {
    const solver = solves.getSolver(message.author.id);
    if (!solver.solves.empty()) {
        const lastSolve = solver.getLastSolve();
        assert(db.popSolve(message.author.id));
        message.channel.send(message.author.username + ', your last solve has been removed.\n'
            + 'The removed solve is shown below:\n'
            + lastSolve.toString());
    }
    else {
        message.channel.send(`${message.author.username}, you do not have an existing solve.`);
    }
});
newCommand('+2', 'changes whether your last solve was a +2', message => {
    const solver = solves.getSolver(message.author.id);
    if (db.togglePlusTwo(message.author.id)) {
        let se = solver.getLastSolve();
        message.channel.send(`${message.author.username}, `
            + `+2 was ${se.plusTwo ? 'added to' : 'removed from'} your last solve.\n`
            + `The modified solve entry is shown below:\n${se.toString()}`);
    }
    else {
        message.channel.send(`${message.author.username}, `
            + `you do not have an existing solve.`);
    }
});
function getPbEmbed() {
    let pbs = solves.getCurrentPbs();
    pbs.sort((e1, e2) => {
        if (e1.time < e2.time)
            return -1;
        if (e1.time > e2.time)
            return 1;
        return 0;
    });
    pbs.length = Math.min(pbs.length, config_1.default.LEADERBOARD_LENGTH);
    let strings = [];
    for (let i = 0; i < pbs.length; ++i) {
        strings.push(`${i + 1}) ${`<@${pbs[i].userId}>: ${pbs[i]}`}`);
    }
    if (strings.length == 0) {
        strings.push('No one has a personal best yet. Be the first to have one!');
    }
    let pbStr = strings.join('\n');
    return {
        color: 0x0099ff,
        title: 'Personal Bests',
        fields: [
            {
                name: 'Leaderboard',
                value: pbStr,
                inline: false,
            },
        ],
        timestamp: new Date(),
        footer: {
            text: config_1.default.FOOTER_STRING,
        },
    };
}
newCommand('pbs', 'shows the personal bests of all members', message => {
    message.channel.send({ embed: getPbEmbed() });
});
const COMMANDS_STRING = Array.from(COMMANDS.values()).map(cmd => cmd.helpString).join('\n');
function getHelpEmbed() {
    return {
        color: 0x0099ff,
        title: config_1.default.BOT_NAME,
        description: pkg.description,
        fields: [
            {
                name: 'Commands (no space required directly after `cube`)',
                value: COMMANDS_STRING,
                inline: false,
            },
        ],
        timestamp: new Date(),
        footer: {
            text: config_1.default.FOOTER_STRING,
        },
    };
}
const lastRequest = new Map();
function canRequest(userId) {
    return (!lastRequest.has(userId) || Date.now() - lastRequest.get(userId) >= config_1.default.COOLDOWN);
}
function handleCommand(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = message.author.id;
        if (!canRequest(userId)) {
            return;
        }
        if (!message.content.startsWith(config_1.default.prefix) && !inSolveMode.has(userId)) {
            return;
        }
        lastRequest.set(userId, Date.now());
        const op = util_js_1.parseCommand(message.content)[0];
        if (COMMANDS.has(op)) {
            COMMANDS.get(op).do(message);
        }
    });
}
exports.handleCommand = handleCommand;
//# sourceMappingURL=commands.js.map