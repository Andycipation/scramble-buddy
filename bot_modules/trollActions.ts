/*
All of the troll stuff. LOL
*/

import config from "../config";
import { Message } from "discord.js";
import fs from "fs";

import { randInt } from "./util";

// joke stuff
const JOKE_FILE = "./jokes.txt"; // path relative to the bot.js file
const JOKES: string[] = [];

export const loadJokes = (): void => {
  const buffer = fs.readFileSync(JOKE_FILE);
  const lines = buffer.toString().split("\n");
  for (const line of lines) {
    if (line.length > 0) {
      JOKES.push(line);
    }
  }
  console.log(`loaded ${JOKES.length} jokes`);
};

const formatJoke = (joke: string): string => {
  return 'Did someone say "joke"? Well, here\'s one:\n' + "```" + joke + "```";
};

/**
 * Handles all troll features of this bot.
 * @param message the message for which to handle troll actions
 */
export const handleTroll = async (message: Message): Promise<void> => {
  if (message.author.id == config.MY_DISCORD_ID) {
    if (message.content == "cubetoggletroll") {
      config.troll = !config.troll;
      message.reply(`Troll messages ${config.troll ? "enabled" : "disabled"}.`);
    }
  }
  if (message.channelId == config.CCG_COUNTING_CHANNEL_ID) {
    // there is a bug: if both David and Michael say it when it's rebooting,
    // this will fail. but i doubt that bug will ever get exposed
    const said = parseInt(message.content, 10);
    if ((said + 1) % 3 == 2) {
      message.channel.send({
        content: `${said + 1} (on behalf of <@${config.MY_DISCORD_ID}>)`,
      });
    }
    return;
  }
  if (!config.troll || message.guild?.id != config.CCG_GUILD_ID) {
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
  if (message.content.toLowerCase().includes("joke")) {
    const joke = JOKES[randInt(0, JOKES.length - 1)];
    message.reply({
      content: formatJoke(joke),
    });
  }
};
