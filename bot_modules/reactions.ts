/*
Module for managing reactions.
*/

import { Message, MessageReaction, Snowflake, User } from "discord.js";
import config from "../config";
import { deleteScramble, setScramble } from "../redis/scramble";

const {
  REMOVE_EMOJI,
  CONFIRM_EMOJI,
  SCRAMBLE_REACT_PROMPT,

  FIRST_EMOJI,
  LEFT_EMOJI,
  RIGHT_EMOJI,
  LAST_EMOJI,
  REFRESH_EMOJI,
} = config;

import * as solves from "./solves";
import { parseMention } from "./util";

// action to take when a reaction is added
class ReactionAddAction {
  public emoji: string;
  // appliesTo(message) - whether this emoji reaction does anything for this message
  public appliesTo: (message: Message) => void;
  public do: (reaction: MessageReaction, user: User) => void;

  public constructor(
    emoji: string,
    appliesTo: (message: Message) => boolean,
    callback: (reaction: MessageReaction, user: User) => void
  ) {
    this.emoji = emoji;
    this.appliesTo = appliesTo;
    this.do = callback;
  }
}

export const REACTION_ADD_ACTIONS: ReactionAddAction[] = [];

/**
 * Adds an action to perform when a reaction is added.
 * @param emoji the emoji the action applies to
 * @param verifier the function that confirms validity of the reaction
 * @param callback the action taken when the reaction is made
 */
const newReactionAddAction = (
  emoji: string,
  verifier: (message: Message) => boolean,
  callback: (reaction: MessageReaction, user: User) => void
) => {
  REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, verifier, callback));
};

/**
 * Removes the reaction from the given message made by the user.
 * @param message message to remove reaction from
 * @param userId the user id of the user who reacted
 * @param emojiChar the emoji to remove
 */
const removeReaction = (
  message: Message,
  userId: Snowflake,
  emojiChar: string
) => {
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter((reaction) =>
    reaction.users.cache.has(userId)
  );
  for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == emojiChar) {
      reaction.users.remove(userId);
    }
  }
};

/**
 * Returns whether or not the given message is a scramble, i.e. if it
 * was sent as a result of a call to `cube get`.
 * @param message the message to verify
 * @returns whether or not the given message shows a scramble
 */
const isScramble = (message: Message): boolean => {
  const lines = message.content.split("\n");
  if (lines.length <= 1) {
    return false;
  }
  return lines[1] == SCRAMBLE_REACT_PROMPT;
};

newReactionAddAction(
  CONFIRM_EMOJI,
  isScramble,
  (reaction: MessageReaction, user: User) => {
    const message = reaction.message as Message;
    removeReaction(message, user.id, REMOVE_EMOJI);

    const lines = message.content.split("\n");
    const scrambleString = lines[0];
    const instructions = lines[1];
    // line 2 is "Contenders:"
    const users = lines.slice(3);

    if (!message.mentions.has(user.id)) {
      // add user id if not already mentioned
      users.push(`<@${user.id}>`);
    }
    setScramble(user.id, scrambleString);
    if (!message.editable) {
      console.error("cannot edit this message");
      return;
    }

    const mentionsString = users.join("\n");
    message.edit(
      `${scrambleString}\n${instructions}\nContenders:\n${mentionsString}`
    );
  }
);

newReactionAddAction(REMOVE_EMOJI, isScramble, (reaction, user) => {
  const message = reaction.message as Message;
  removeReaction(message, user.id, CONFIRM_EMOJI);
  removeReaction(message, user.id, REMOVE_EMOJI);
  const lines = message.content.split("\n");
  const scrambleString = lines[0];
  const instructions = lines[1];
  const tgt = `<@${user.id}>`;
  const users = lines.slice(3).filter((u) => u != tgt);
  deleteScramble(user.id); // could return true or false
  if (!message.editable) {
    console.error("cannot edit this message");
    return;
  }
  let edited = `${scrambleString}\n${instructions}`;
  if (users.length != 0) {
    edited += `\nContenders:\n${users.join("\n")}`;
  }
  message.edit(edited);
});

// left and right arrows for scrolling through a profile

/**
 * Checks if the given message is a profile embed message, called by
 * the message 'cube view [user mention]'.
 * @param message the message to verify
 * @returns whether or not the given message is a profile embed
 */
const isProfilePage = (message: Message): boolean => {
  const embeds = message.embeds;
  // too many type assertions
  return embeds.length == 1 && embeds[0].footer!.text!.includes("/");
};

/*
Map each reaction to a formula to update the page:
when PROFILE_EMOJIS[i] is clicked, the embed should change to page
  FUNCTIONS[i](userId, x)
where
- userId is the id of the user that the embed is profiling, and
- x is the number of the page that is currently displayed.
*/
const PROFILE_EMOJIS = [
  FIRST_EMOJI,
  LEFT_EMOJI,
  REFRESH_EMOJI,
  RIGHT_EMOJI,
  LAST_EMOJI,
] as const;
const FUNCTIONS: readonly ((userId: Snowflake, x: number) => number)[] = [
  (userId, x) => 0,
  (userId, x) => x - 1,
  (userId, x) => x,
  (userId, x) => x + 1,
  (userId, x) => solves.getSolver(userId).numPages - 1,
] as const;

for (let i = 0; i < PROFILE_EMOJIS.length; ++i) {
  const emoji = PROFILE_EMOJIS[i];
  // add the reaction action that changes the profile page
  newReactionAddAction(emoji, isProfilePage, (reaction, user) => {
    // let message = reaction.message;
    // if (reaction.message.partial) {
    //   message = message.fetch();
    // }
    const message = reaction.message as Message;
    removeReaction(message, user.id, emoji);
    if (!message.editable) {
      console.error("why can't the bot edit its own message? :(");
      return false;
    }
    // get the user and current page from the embed's footer text content
    const embed = message.embeds[0];
    // description is "Discord User: <@(user id)>"
    // assert(embed.description !== null);
    // assert(embed.description && embed.footer);
    const userId = parseMention(embed.description!.split(" ")[2]);
    const strs = embed.footer!.text!.split(" "); // footer strings
    const currentPage = parseInt(strs[strs.length - 1].split("/")[0], 10) - 1;
    const newEmbed = solves.getSolverEmbed(
      userId,
      FUNCTIONS[i](userId, currentPage)
    );
    if (!newEmbed) {
      return false; // invalid request
    }
    message.edit({ embeds: [newEmbed] });
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
