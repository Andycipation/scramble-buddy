/*
The driver for the ScrambleBot.
*/


const Discord = require('discord.js');
const pkg = require('./package.json');

// config and parameters
const {
  MY_DISCORD_ID,
  DATA_CHANNEL_ID,
  prefix,
  ignoreBots,
  COOLDOWN,
} = require('./config.js');
var { troll } = require('./config.js');

const { COMMANDS } = require('./modules/commands.js');
const { REACTION_ADD_ACTIONS } = require('./modules/reactions.js');
const db = require('./modules/database.js');
const init = require('./modules/init.js');
const timer = require('./modules/timer.js');

const bot = new Discord.Client();

bot.on('ready', function() {
  bot.user.setActivity(`type '${prefix} help' for help`);  // set bot status
  // bot.user.setAvatar('./assets/avatar.png');
  
  // initialize all non-bot users
  for (let guild of bot.guilds.cache.values()) {
    init.initGuild(guild);
  }
  
  // load past solves; there may be some async problems here
  bot.channels.fetch(DATA_CHANNEL_ID).then(channel => {
    db.loadSolves(channel);
  }).catch(error => {
    console.error('could not fetch database channel:');
    console.error(error);
  });
  console.log(`${pkg.name} v${pkg.version} is now up and running.`);
});

const lastRequest = new Map();

function canRequest(id) {
  return (!lastRequest.has(id) || Date.now() - lastRequest.get(id) >= COOLDOWN);
}

function handleTroll(message) {
  if (!troll) {
    return;
  }
  if (message.content == 'Hi!') {
    message.channel.send('Hi!');
  }
  if (message.content == 'gn') {
    message.channel.send('Good night!');
  }
  if (message.content.toLowerCase().substring(0, 7) == 'vc tmr?') {
    message.channel.send('vc tmr.');
  }
  if (message.content.toLowerCase().substring(0, 6) == 'vc tn?') {
    message.channel.send('vc tn.');
  }
}

// when a message is sent
bot.on('message', message => {
  // ignore message if sent by self, or sender is bot and ignoreBots is on
  if (message.author.id == bot.user.id || (message.author.bot && ignoreBots)) {
    return;
  }
  handleTroll(message);  // do troll responses
  
  // actual functionality
  timer.checkStop(message);
  let msg = message.content.trim();
  if (!msg.startsWith(prefix) || !canRequest(message.author.id)) {
    return;
  }
  lastRequest.set(message.author.id, Date.now());
  let args = msg.substring(prefix.length).trim().toLowerCase().split(' ');
  let op = args[0];
  
  // check if troll should be toggled
  if (message.author.id == MY_DISCORD_ID && op == 'toggletroll') {
    troll ^= 1;
    let s = (troll ? 'enabled' : 'disabled');
    message.channel.send(`Troll messages ${s}.`);
  }
  
  // do the actual commands
  for (let cmd of COMMANDS) {
    if (cmd.names.includes(op)) {
      cmd.do(message);
    }
  }
});

// when the bot is added to a server
bot.on('guildCreate', guild => {
  init.initGuild(guild);
});

// when a member joins a server the bot is currently in
bot.on('guildMemberAdd', member => {
  init.initUser(member.user);
});


// when a reaction is added to an existing message
bot.on('messageReactionAdd', (messageReaction, user) => {
  // console.log('someone reacted to: ' + messageReaction.message.content);
  if (user.id == bot.user.id || (user.bot && ignoreBots)) {
    return; // ignore reacts by self
  }
  REACTION_ADD_ACTIONS.forEach(raa => { // related acute angle lol
    if (messageReaction.emoji.name == raa.emoji) {
      raa.do(messageReaction, user);
    }
  });
});

// when a reaction is removed from an existing message
bot.on('messageReactionRemove', (messageReaction, user) => {
  if (user.id == bot.user.id || (user.bot && ignoreBots)) {
    return;
  }
  if (messageReaction.emoji.name == REACTION_ADD_ACTIONS[0].emoji) {
    REACTION_ADD_ACTIONS[1].do(messageReaction, user); // hack but whatever
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
//   checkStop2(channel, user);
// });

// log in using environment variable!
require('dotenv').config();
bot.login(process.env.TOKEN);
