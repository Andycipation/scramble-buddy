/*
Module for managing reactions.
*/


const {
  prefix,
  scrambleRemoveEmoji,
  scrambleConfirmEmoji,
} = require('../config.js');
const timer = require('./timer.js');


class ReactionAddAction {
  constructor(emoji, callback) {
    this.emoji = emoji;
    this.do = callback;
  }
}


const REACTION_ADD_ACTIONS = [];

// add a new action to perform when a reaction is added
// callback should take two objects as arguments: messageReaction and user
function newReactionAddAction(emoji, callback) {
  REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, callback));
}

function removeReaction(message, userId, emojiChar) {
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userId));
  for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == emojiChar) {
      reaction.users.remove(userId);
    }
  }
}

newReactionAddAction(scrambleConfirmEmoji, (messageReaction, user) => {
  const message = messageReaction.message;
  removeReaction(message, user.id, scrambleRemoveEmoji);
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

newReactionAddAction(scrambleRemoveEmoji, (messageReaction, user) => {
  const message = messageReaction.message;
  removeReaction(message, user.id, scrambleConfirmEmoji);
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
// newReactionRemoveAction(scrambleConfirmEmoji, (messageReaction, user) => {
//
// });


exports.REACTION_ADD_ACTIONS = REACTION_ADD_ACTIONS;
