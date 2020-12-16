/*
All of the troll stuff. LOL
*/

const {
  CCG_GUILD_ID,
  MY_DISCORD_ID,
} = require('../config.js');
var { troll } = require('../config.js');
const { parseCommand } = require('./util.js');

// joke stuff
const fs = require('fs');
const JOKE_FILE = './jokes.txt'; // path relative to the bot.js file
const JOKES = [];

async function loadJokes() {
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
 * @param {Discord.Message} message the message for which to handle troll actions
 */
async function handleTroll(message) {
  if (message.author.id == MY_DISCORD_ID) {
    const args = parseCommand(message.content);
    const op = args[0];
    if (op == 'toggletroll') {
      troll ^= 1;
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
  if (message.guild.id == CCG_GUILD_ID) {
    if (message.content.includes('joke')) {
      const joke = JOKES[randInt(0, JOKES.length - 1)];
      message.channel.send('Did someone say "joke"? Well, here\'s one: ```' + joke + '```');
    }
  }
}

exports.loadJokes = loadJokes;
exports.handleTroll = handleTroll;