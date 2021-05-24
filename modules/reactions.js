"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REACTION_ADD_ACTIONS = void 0;
const config_1 = require("../config");
const { REMOVE_EMOJI, CONFIRM_EMOJI, SCRAMBLE_REACT_PROMPT, FIRST_EMOJI, LEFT_EMOJI, RIGHT_EMOJI, LAST_EMOJI, REFRESH_EMOJI, } = config_1.default;
const solves = require("./solves.js");
const timer = require("./timer.js");
const util_js_1 = require("./util.js");
class ReactionAddAction {
    constructor(emoji, appliesTo, callback) {
        this.emoji = emoji;
        this.appliesTo = appliesTo;
        this.do = callback;
    }
}
exports.REACTION_ADD_ACTIONS = [];
function newReactionAddAction(emoji, verifier, callback) {
    exports.REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, verifier, callback));
}
function removeReaction(message, userId, emojiChar) {
    const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userId));
    for (const reaction of userReactions.values()) {
        if (reaction.emoji.name == emojiChar) {
            reaction.users.remove(userId);
        }
    }
}
function isScramble(message) {
    let lines = message.content.split('\n');
    if (lines.length <= 1) {
        return false;
    }
    return (lines[1] == SCRAMBLE_REACT_PROMPT);
}
newReactionAddAction(CONFIRM_EMOJI, isScramble, (reaction, user) => {
    const message = reaction.message;
    removeReaction(message, user.id, REMOVE_EMOJI);
    let lines = message.content.split('\n');
    let scrambleString = lines[0];
    let instructions = lines[1];
    let users = lines.slice(3);
    let addUser = true;
    for (const str of users) {
        if (util_js_1.parseMention(str) == user.id) {
            addUser = false;
        }
    }
    if (addUser) {
        users.push(`<@${user.id}>`);
    }
    timer.setScramble(user.id, scrambleString);
    if (!message.editable) {
        console.error('cannot edit this message');
        return;
    }
    message.edit(`${scrambleString}\n${instructions}\nContenders:\n${users.join('\n')}`);
});
newReactionAddAction(REMOVE_EMOJI, isScramble, (reaction, user) => {
    const message = reaction.message;
    removeReaction(message, user.id, CONFIRM_EMOJI);
    removeReaction(message, user.id, REMOVE_EMOJI);
    let lines = message.content.split('\n');
    let scrambleString = lines[0];
    let instructions = lines[1];
    let tgt = `<@${user.id}>`;
    let users = lines.slice(3).filter(u => (u != tgt));
    timer.deleteScramble(user.id);
    if (!message.editable) {
        console.error('cannot edit this message');
        return;
    }
    let edited = `${scrambleString}\n${instructions}`;
    if (users.length != 0) {
        edited += `\nContenders:\n${users.join('\n')}`;
    }
    message.edit(edited);
});
function isProfilePage(message) {
    const embeds = message.embeds;
    return (embeds.length == 1 && embeds[0].footer.text.includes('/'));
}
const PROFILE_EMOJIS = [
    FIRST_EMOJI,
    LEFT_EMOJI,
    REFRESH_EMOJI,
    RIGHT_EMOJI,
    LAST_EMOJI,
];
const FUNCTIONS = [
    (userId, x) => 0,
    (userId, x) => x - 1,
    (userId, x) => x,
    (userId, x) => x + 1,
    (userId, x) => solves.getSolver(userId).numPages - 1,
];
for (let i = 0; i < PROFILE_EMOJIS.length; ++i) {
    const emoji = PROFILE_EMOJIS[i];
    newReactionAddAction(emoji, isProfilePage, (reaction, user) => {
        const message = reaction.message;
        removeReaction(message, user.id, emoji);
        if (!message.editable) {
            console.error("why can't the bot edit its own message? :(");
            return false;
        }
        const embed = message.embeds[0];
        const userId = util_js_1.parseMention(embed.description.split(' ')[2]);
        const strs = embed.footer.text.split(' ');
        const currentPage = parseInt(strs[strs.length - 1].split('/')[0], 10) - 1;
        const newEmbed = solves.getSolverEmbed(userId, FUNCTIONS[i](userId, currentPage));
        if (newEmbed === null) {
            return false;
        }
        message.edit({ embed: newEmbed });
        return true;
    });
}
//# sourceMappingURL=reactions.js.map