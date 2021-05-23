/*
The driver for the bot.
*/


const Discord = require('discord.js');
const pkg = require('./package.json');

// config and parameters
import config from './config.js';
const {
  DATA_CHANNEL_ID,
  prefix,
  IGNORE_BOTS,
} = config;

const actionsTroll = require('./modules/actions_troll.js');
const commands = require('./modules/commands.js');
const db = require('./modules/database.js');
const { REACTION_ADD_ACTIONS } = require('./modules/reactions.js');
const solves = require('./modules/solves.js');
const timer = require('./modules/timer.js');
const { parseCommand, randInt } = require('./modules/util.js');

const bot = new Discord.Client();


bot.on('ready', async () => {
  bot.user.setActivity(`type '${prefix} help' for help`); // set bot status
  // bot.user.setAvatar('./assets/avatar.png');
  await actionsTroll.loadJokes();

  // load past solves
  let dataChannel = await bot.channels.fetch(DATA_CHANNEL_ID);
  await db.loadSolves(dataChannel);

  // ready to go
  console.log(`${pkg.name}, v${pkg.version} is now up and running.`);
});

/**
 * Checks if this message stops a timer.
 * @param {Discord.Message} message the message to check
 */
async function checkTimer(message) {
  if (timer.hasTimer(message.author.id, message.channel.id)) {
    let time = await timer.stopTimer(message);
    let hadScramble = true;
    if (time < 0) { // kind of a hack
      time = -time;
      hadScramble = false;
    }
    let s = `Timer stopped for ${message.author.username}. **${timer.formatTime(time)}**`;
    if (!hadScramble) {
      s += '\nTo track your solves, generate a scramble using `cube get` and'
          + ' react to it. Then, your next time will be logged on your profile.';
    } else if (solves.getSolver(message.author.id).lastSolveWasPb()) {
      s += `\nThat is a new personal best. Congratulations!`;
    }
    // message.reply(s);
    message.channel.send(s);
  }
}

// when a message is sent
bot.on('message', async message => {
  const userId = message.author.id;
  if (userId == bot.user.id || (message.author.bot && IGNORE_BOTS)) {
    // ignore message if sent by self, or sender is bot and IGNORE_BOTS is on
    return;
  }
  if (message.channel.id == DATA_CHANNEL_ID) {
    // delete messages sent in the logs to avoid parsing errors
    message.delete({ reason: 'not supposed to send messages in the data channel' });
    return;
  }
  await actionsTroll.handleTroll(message); // do troll responses
  await checkTimer(message);
  await commands.handleCommand(message);
});

// when a reaction is added to an existing message
bot.on('messageReactionAdd', async (messageReaction, user) => {
  // console.log('someone reacted to: ' + messageReaction.message.content);
  if (messageReaction.message.author.id != bot.user.id) {
    return; // only handle reactions to messages sent by this bot
  }
  if (user.id == bot.user.id || (user.bot && IGNORE_BOTS)) {
    return; // ignore reacts by irrelevant users
  }
  for (const raa of REACTION_ADD_ACTIONS) {
    if (messageReaction.emoji.name == raa.emoji && raa.appliesTo(messageReaction.message)) {
      raa.do(messageReaction, user);
    }
  }
});

// when a reaction is removed from an existing message
bot.on('messageReactionRemove', async (messageReaction, user) => {
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
});

// log in using environment variable!
require('dotenv').config();
bot.login(process.env.TOKEN);
