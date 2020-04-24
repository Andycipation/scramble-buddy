/*
Module for managing reactions.
*/

const { prefix, scrambleRemoveEmoji, scrambleConfirmEmoji } = require('../settings.js');
const { curScramble } = require('./timer.js');

class ReactionAddAction {
  constructor(emoji, callback) {
    this.emoji = emoji;
    this.do = callback;
  }
}

const REACTION_ADD_ACTIONS = [];

function newReactionAddAction(emoji, callback) {
  REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, callback));
}

newReactionAddAction(scrambleConfirmEmoji, (messageReaction, user) => {
  const message = messageReaction.message;
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
	for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == scrambleRemoveEmoji) {
  		reaction.users.remove(user.id);
    }
	}
  let lines = message.content.split('\n');
  let scrambleString = lines[0];
  let instructions = lines[1];
  let users = lines.slice(3);
  users.push(`<@${user.id}>`);
  curScramble.set(user.id, scrambleString);
  if (!message.editable) {
    console.log('cannot edit this message');
    return;
  }
  message.edit(`${scrambleString}\n${instructions}\nContenders:\n${users.join('\n')}`);
});

newReactionAddAction(scrambleRemoveEmoji, (messageReaction, user) => {
  const message = messageReaction.message;
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
  for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == scrambleConfirmEmoji) {
      reaction.users.remove(user.id);
    }
  }
  let lines = message.content.split('\n');
  let scrambleString = lines[0];
  let instructions = lines[1];
  let tgt = `<@${user.id}>`;
  let users = lines.slice(3).filter(u => u != tgt);
  // console.log('filtered users: ' + users);
  curScramble.delete(user.id);
  if (!message.editable) {
    console.log('cannot edit this message');
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
