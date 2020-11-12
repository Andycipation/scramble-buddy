/*
Module for managing reactions.
*/


const {
  REMOVE_EMOJI,
  CONFIRM_EMOJI,
  SCRAMBLE_REACT_PROMPT,

  FIRST_EMOJI,
  LEFT_EMOJI,
  RIGHT_EMOJI,
  LAST_EMOJI,
  REFRESH_EMOJI,
} = require('../config.js');

const solves = require('./solves.js');
const timer = require('./timer.js');
const { parseMention } = require('./util.js');


// action to take when a reaction is added
class ReactionAddAction {
  constructor(emoji, appliesTo, callback) {
    // appliesTo(message) - whether the message applies to this emoji
    this.emoji = emoji;
    this.appliesTo = appliesTo;
    this.do = callback;
  }
}


const REACTION_ADD_ACTIONS = [];

/**
 * Adds an action to perform when a reaction is added.
 * @param {string} emoji the emoji the action applies to
 * @param {Function} verifier the function that confirms validity of the reaction
 * @param {Function} callback the action taken when the reaction is made
 */
function newReactionAddAction(emoji, verifier, callback) {
  REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, verifier, callback));
}


/**
 * Removes the reaction from the given message made by the user.
 * @param {Message} message message to remove reaction from
 * @param {string} userId the user id of the user who reacted
 * @param {string} emojiChar the emoji to remove
 */
function removeReaction(message, userId, emojiChar) {
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter(
    reaction => reaction.users.cache.has(userId)
  );
  for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == emojiChar) {
      reaction.users.remove(userId);
    }
  }
}


/**
 * Returns whether or not the given message is a scramble, i.e. if it
 * was sent as a result of a call to `cube get`.
 * @param {Message} message the message to verify
 * @returns {boolean} whether or not the given message shows a scramble
 */
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
    if (parseMention(str) == user.id) {
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
  let lines = message.content.split('\n');
  let scrambleString = lines[0];
  let instructions = lines[1];
  let tgt = `<@${user.id}>`;
  let users = lines.slice(3).filter(u => (u != tgt));
  timer.deleteScramble(user.id);  // could return true or false
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


// left and right arrows for scrolling through a profile

/**
 * Checks if the given message is a profile embed message, called by
 * the message 'cube view [user mention]'.
 * @param {Message} message the message to verify
 * @returns {boolean} whether or not the given message is a profile embed
 */
function isProfilePage(message) {
  let embeds = message.embeds;
  if (embeds.length != 1) {
    return false;
  }
  return (embeds[0].footer.text.includes('/'));
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
  const func = FUNCTIONS[i];
  // add the reaction action that changes the profile page
  newReactionAddAction(emoji, isProfilePage, (reaction, user) => {
    const message = reaction.message;
    removeReaction(message, user.id, emoji);
    if (!message.editable) {
      console.error("why can't the bot edit its own message? :(");
      return false;
    }
    const embed = message.embeds[0];
    const userId = parseMention(embed.description.split(' ')[2]);
    const strs = embed.footer.text.split(' ');
    const currentPage = parseInt(strs[strs.length - 1].split('/')[0], 10) - 1;
    const newEmbed = solves.getSolverEmbed(userId, func(userId, currentPage));
    if (newEmbed === null) {
      return false;
    }
    message.edit({ embed: newEmbed });
    return true;
  });
}


// class ReactionRemoveAction {
//   constructor(emoji, callback) {
//     this.emoji = emoji;
//     this.do = callback;
//   }
// }
//
//
// const REACTION_REMOVE_ACTIONS = [];
//
// function newReactionRemoveAction(emoji, callback) {
//   REACTION_REMOVE_ACTIONS.push(new ReactionRemoveAction(emoji, callback));
// }
//
// newReactionRemoveAction(CONFIRM_EMOJI, (reaction, user) => {
//
// });


exports.REACTION_ADD_ACTIONS = REACTION_ADD_ACTIONS;
