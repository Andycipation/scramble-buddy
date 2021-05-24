/*
All of the troll stuff. LOL
*/

import config from '../config';
const {
  CCG_GUILD_ID,
  MY_DISCORD_ID,
} = config;
var { troll } = config;

import { parseCommand, randInt } from './util.js';

import fs = require('fs');
import { Message } from 'discord.js';

// joke stuff
const JOKE_FILE = './jokes.txt'; // path relative to the bot.js file
const JOKES: string[] = [];

export async function loadJokes(): Promise<void> {
  console.log('loading jokes');
  fs.readFile(JOKE_FILE, (error, data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.length > 0) {
        JOKES.push(line);
      }
    }
  });
}

/**
 * Handles all troll features of this bot.
 * @param message the message for which to handle troll actions
 */
export async function handleTroll(message: Message) {
  if (message.author.id == MY_DISCORD_ID) {
    const args = parseCommand(message.content);
    const op = args[0];
    if (op == 'toggletroll') {
      troll = !troll;
      // message.reply(`Troll messages ${troll ? 'enabled' : 'disabled'}.`);
      message.channel.send(`Troll messages ${troll ? 'enabled' : 'disabled'}.`);
    }
  }
  if (!troll) {
    return;
  }
  if (message.content == 'Hi!') {
    // message.reply('Hi!');
    message.channel.send('Hi!');
  }
  if (message.content == 'gn') {
    // message.reply('Good night!');
    message.channel.send('Good night!');
  }
  if (message.content.toLowerCase().startsWith('vc tmr?')) {
    // message.reply('vc tmr.');
    message.channel.send('vc tmr.');
  }
  if (message.content.toLowerCase().startsWith('vc tn?')) {
    // message.reply('vc tn.');
    message.channel.send('vc tn.');
  }
  if (message.content.toLowerCase().startsWith('vc rn?')) {
    // message.reply('vc rn.');
    message.channel.send('vc rn.');
  }
  if (message.guild?.id == CCG_GUILD_ID) {
    if (message.content.toLowerCase().includes('joke')) {
      const joke = JOKES[randInt(0, JOKES.length - 1)];
      message.channel.send('Did someone say "joke"? Well, here\'s one: ```' + joke + '```');
    }
  }
}
