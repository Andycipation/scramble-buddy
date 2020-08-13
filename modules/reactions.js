/*
Module for managing reactions.
*/


const {
  REMOVE_EMOJI,
  CONFIRM_EMOJI,
  SCRAMBLE_REACT_PROMPT,
  LEFT_EMOJI,
  RIGHT_EMOJI,
} = require('../config.js');

const solves = require('./solves.js');
const timer = require('./timer.js');


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

// add a new action to perform when a reaction is added
// callback should take two objects as arguments: reaction and user
function newReactionAddAction(emoji, verifier, callback) {
  REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, verifier, callback));
}

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


// check mark and cross for contending for a scramble

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
  users.push(`<@${user.id}>`);
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
  let users = lines.slice(3).filter(u => u != tgt);
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
 */
function isProfilePage(message) {
  let embeds = message.embeds;
  if (embeds.length != 1) {
    return false;
  }
  return (embeds[0].footer.text.includes('/'));
}

newReactionAddAction(LEFT_EMOJI, message => isProfilePage(message, 2), (reaction, user) => {
  const message = reaction.message;
  // clear emojis of both types
  removeReaction(message, user.id, LEFT_EMOJI);
  removeReaction(message, user.id, RIGHT_EMOJI);
  if (!message.editable) {
    console.error('cannot scroll left on profile');
    return;
  }
  const embed = message.embeds[0];
  let userId = embed.description.split(' ')[2];
  userId = userId.substring(2, userId.length - 1);
  const strs = embed.footer.text.split(' ');
  const currentPage = parseInt(strs[strs.length - 1].split('/')[0], 10) - 1;
  const newEmbed = solves.getUserEmbed(userId, currentPage - 1);  // the only difference from below
  if (newEmbed !== null) {
    message.edit({ embed: newEmbed });
  }
});

newReactionAddAction(RIGHT_EMOJI, message => isProfilePage(message, 1), (reaction, user) => {
  const message = reaction.message;
  // clear emojis of both types
  removeReaction(message, user.id, LEFT_EMOJI);
  removeReaction(message, user.id, RIGHT_EMOJI);
  if (!message.editable) {
    console.error('cannot scroll right on profile');
    return;
  }
  const embed = message.embeds[0];
  let userId = embed.description.split(' ')[2];
  userId = userId.substring(2, userId.length - 1);
  const strs = embed.footer.text.split(' ');
  const currentPage = parseInt(strs[strs.length - 1].split('/')[0], 10) - 1;
  const newEmbed = solves.getUserEmbed(userId, currentPage + 1);  // the only difference from above
  if (newEmbed !== null) {
    message.edit({ embed: newEmbed });
  }
});

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
