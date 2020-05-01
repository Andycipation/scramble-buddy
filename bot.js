/*
The driver for the ScrambleBot.
*/


const Discord = require('discord.js');
const pkg = require('./package.json');

const { prefix, troll, ignoreBots, COOLDOWN } = require('./settings.js');
const { COMMANDS } = require('./modules/commands.js');
const { REACTION_ADD_ACTIONS } = require('./modules/reactions.js');
const timer = require('./modules/timer.js');
const init = require('./modules/init.js');

const bot = new Discord.Client();

bot.on('ready', function() {
  bot.user.setActivity(`type '${prefix} help' for help`); // set bot status
  // bot.user.setAvatar('./assets/avatar.png');
  init.loadDatabase();
  for (let guild of bot.guilds.cache.values()) {
    init.initGuild(guild);
  }
  console.log(`${pkg.name} v${pkg.version} is now up and running.`);
});

const lastRequest = new Map();

function canRequest(id) {
  return (!lastRequest.has(id) || Date.now() - lastRequest.get(id) >= COOLDOWN);
}

// when a message is sent
bot.on('message', message => {
  if (message.author.id == bot.user.id || (message.author.bot && ignoreBots)) {
    // ignore message if sent by self, or sender is bot and ignoreBots is on
    return;
  }
  timer.checkStop(message);
  let msg = message.content.trim();
  // troll messages
  if (troll) {
    if (msg.startsWith('Hi!')) {
      message.channel.send('Hi!');
      return;
    }
    if (msg.startsWith('gn')) {
      message.channel.send('Good night!');
      return;
    }
  }
  // actual functionality
  if (!msg.startsWith(prefix) || !canRequest(message.author.id)) {
    return;
  }
  lastRequest.set(message.author.id, Date.now());
  let args = msg.substring(prefix.length).trim().toLowerCase().split(' ');
  let op = args[0];
  COMMANDS.forEach(cmd => {
    if (cmd.names.includes(op)) {
      cmd.do(message);
    }
  });
});

bot.on('guildCreate', guild => {
  init.initGuild(guild);
});

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
