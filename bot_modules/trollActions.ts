/*
All of the troll stuff. LOL
*/

import config from "../config";
import { Message } from "discord.js";

import { parseCommand, randInt } from "./util";

import fs from "fs";

// joke stuff
const JOKE_FILE = "./jokes.txt"; // path relative to the bot.js file
const JOKES: string[] = [];

export const loadJokes = async (): Promise<void> => {
  console.log("loading jokes");
  fs.readFile(JOKE_FILE, (error, data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.length > 0) {
        JOKES.push(line);
      }
    }
  });
};

/**
 * Handles all troll features of this bot.
 * @param message the message for which to handle troll actions
 */
export const handleTroll = async (message: Message): Promise<void> => {
  if (message.author.id == config.MY_DISCORD_ID) {
    const args = parseCommand(message.content);
    const op = args[0];
    if (op == "toggletroll") {
      config.troll = !config.troll;
      // message.reply(`Troll messages ${troll ? 'enabled' : 'disabled'}.`);
      message.channel.send(
        `Troll messages ${config.troll ? "enabled" : "disabled"}.`
      );
    }
  }
  if (!config.troll) {
    return;
  }
  if (message.content == "Hi!") {
    // message.reply('Hi!');
    message.channel.send("Hi!");
  }
  if (message.content == "gn") {
    // message.reply('Good night!');
    message.channel.send("Good night!");
  }
  if (message.content.toLowerCase().startsWith("vc tmr?")) {
    // message.reply('vc tmr.');
    message.channel.send("vc tmr.");
  }
  if (message.content.toLowerCase().startsWith("vc tn?")) {
    // message.reply('vc tn.');
    message.channel.send("vc tn.");
  }
  if (message.content.toLowerCase().startsWith("vc rn?")) {
    // message.reply('vc rn.');
    message.channel.send("vc rn.");
  }
  if (message.guild?.id == config.CCG_GUILD_ID) {
    if (message.content.toLowerCase().includes("joke")) {
      const joke = JOKES[randInt(0, JOKES.length - 1)];
      message.channel.send(
        'Did someone say "joke"? Well, here\'s one: ```' + joke + "```"
      );
    }
  }
};
