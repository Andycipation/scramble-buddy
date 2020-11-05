/*
The driver for the bot.
*/


const Discord = require('discord.js');
const pkg = require('./package.json');

// config and parameters
const {
  MY_DISCORD_ID,
  DATA_CHANNEL_ID,
  CCG_GUILD_ID,
  prefix,
  IGNORE_BOTS,
  COOLDOWN,
} = require('./config.js');

const commands = require('./modules/commands.js');
const { REACTION_ADD_ACTIONS } = require('./modules/reactions.js');
const db = require('./modules/database.js');
const solves = require('./modules/solves.js');
const timer = require('./modules/timer.js');
const { parseCommand, randInt } = require('./modules/util.js');

const bot = new Discord.Client();

// troll stuff
var { troll } = require('./config.js');
const JOKE_FILE = './jokes.txt';
const JOKES = [];
const fs = require('fs');

bot.on('ready', async () => {
  bot.user.setActivity(`type '${prefix} help' for help`);  // set bot status
  // bot.user.setAvatar('./assets/avatar.png');

  // for (const guild of bot.guilds.cache.values()) {
  //   console.log(`${guild.name} has id ${guild.id}`);
  // }

  // create a new server and invite myself to it!
  // bot.guilds.create("ScrambleBuddy's Server");
  // bot.users.fetch(MY_DISCORD_ID).then(user => {
  //
  // });

  // load past solves
  let dataChannel = await bot.channels.fetch(DATA_CHANNEL_ID);
  await db.loadSolves(dataChannel);

  // load jokes
  fs.readFile(JOKE_FILE, (error, data) => {
    let lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.length > 0) {
        JOKES.push(line);
      }
    }
  });

  // ready to go
  console.log(`${pkg.name}, v${pkg.version} is now up and running.`);
});

const lastRequest = new Map();

/**
 * Checks if the user with the given id can make a request to the bot.
 * @param {string} id the id of the user to check
 * @returns {boolean} whether or not the user can make a request at this time
 */
function canRequest(id) {
  return (!lastRequest.has(id) || Date.now() - lastRequest.get(id) >= COOLDOWN);
}

/**
 * Handles all troll features of this bot.
 * @param {Discord.Message} message the message for which to handle troll actions
 */
async function handleTroll(message) {
  if (!troll) {
    return;
  }
  if (message.content == 'Hi!') {
    message.channel.send('Hi!');
  }
  if (message.content == 'gn') {
    message.channel.send('Good night!');
  }
  if (message.content.toLowerCase().startsWith('vc tmr?')) {
    message.channel.send('vc tmr.');
  }
  if (message.content.toLowerCase().startsWith('vc tn?')) {
    message.channel.send('vc tn.');
  }
  if (message.guild.id == CCG_GUILD_ID) {
    if (message.content.includes('joke')) {
      let joke = JOKES[randInt(0, JOKES.length - 1)];
      message.channel.send('Did someone say "joke"? Well, here\'s one: ```' + joke + '```');
    }
  }
}

const solveMode = new Set();

// when a message is sent
bot.on('message', async message => {
  const userId = message.author.id;
  // ignore message if sent by self, or sender is bot and IGNORE_BOTS is on
  if (userId == bot.user.id || (message.author.bot && IGNORE_BOTS)) {
    return;
  }
  await handleTroll(message);  // do troll responses

  // check timer
  if (timer.hasTimer(userId, message.channel.id)) {
    let time = await timer.stopTimer(message);
    let hadScramble = true;
    if (time < 0) {
      time = -time;
      hadScramble = false;
    }
    let s = `Timer stopped for ${message.author.username}. **${timer.formatTime(time)}**`;
    if (!hadScramble) {
      s += '\nTo track your solves, generate a scramble using `cube get` and'
          + ' react to it. Then, your next time will be logged on your profile.';
    } else if (solves.getSolver(userId).lastSolveWasPb()) {
      s += `\nThat is a new personal best. Congratulations!`;
    }
    message.channel.send(s);
  }

  // check if message was a valid command and not "spammed" too quickly
  let msg = message.content.trim();
  if (!canRequest(message.author.id)) {
    return;
  }
  if (!msg.startsWith(prefix) && !commands.inSolveMode.has(userId)) {
    return;
  }
  let args = parseCommand(msg);
  lastRequest.set(message.author.id, Date.now());  // reset cooldown

  // check commands
  let op = args[0];

  // check if troll should be toggled
  if (message.author.id == MY_DISCORD_ID && op == 'toggletroll') {
    troll ^= 1;
    message.channel.send(`Troll messages ${troll ? 'enabled' : 'disabled'}.`);
  }

  // do the actual command
  if (commands.COMMANDS.has(op)) {
    commands.COMMANDS.get(op).do(message);
  }
});

// when a reaction is added to an existing message
bot.on('messageReactionAdd', (messageReaction, user) => {
  // console.log('someone reacted to: ' + messageReaction.message.content);
  if (messageReaction.message.author.id != bot.user.id) {
    return;  // only handle reactions to messages sent by this bot
  }
  if (user.id == bot.user.id || (user.bot && IGNORE_BOTS)) {
    return;  // ignore reacts by self
  }
  for (const raa of REACTION_ADD_ACTIONS) {
    if (messageReaction.emoji.name == raa.emoji && raa.appliesTo(messageReaction.message)) {
      raa.do(messageReaction, user);
    }
  }
});

// when a reaction is removed from an existing message
bot.on('messageReactionRemove', (messageReaction, user) => {
  if (user.id == bot.user.id || (user.bot && IGNORE_BOTS)) {
    return;
  }
  if (messageReaction.emoji.name == REACTION_ADD_ACTIONS[0].emoji) {
    REACTION_ADD_ACTIONS[1].do(messageReaction, user);  // hack but whatever
  }
  // REACTION_REMOVE_ACTIONS.forEach(rda => {
  //   if (messageReaction.emoji.name == rda.emoji) {
  //     rda.do(messageReaction, user);
  //   }
  // });
})

// this is too slow to start/stop the timer accurately
// bot.on('typingStart', function(channel, user) {
//   console.log(user);
//   timer._stopTimer(channel, user);  // this is currently private
// });

// log in using environment variable!
require('dotenv').config();
bot.login(process.env.TOKEN);
