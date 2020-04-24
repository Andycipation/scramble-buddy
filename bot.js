/*
client ID:
701873854930354287
*/


const Discord = require('discord.js');
const config = require('./config.json');
const pkg = require('./package.json');

const { prefix, troll, ignoreBots, COOLDOWN } = require('./settings.js');
const { COMMANDS } = require('./modules/commands.js');
const { REACTION_ADD_ACTIONS } = require('./modules/reactions.js');
const timer = require('./modules/timer.js');

const bot = new Discord.Client();

bot.on('ready', function() {
  bot.user.setActivity(`${prefix} is my prefix`); // set bot status
  // bot.user.setAvatar('./avatar.png');
  if (troll) {
    // ADMathNoob in Corona Cuber Gang, #bot channel
    timers.set('199904392504147968', new Map());
    timers.get('199904392504147968').set('701904186081804320', Date.now() - 423784880);
  }
  console.log('Bot is ready.');
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
  // message.react('😄');
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
  // // console.log('someone removed a reaction on: ' + messageReaction.message.content);
  // if (user.id == bot.user.id || (user.bot && ignoreBots)) {
  //   return;
  // }
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

bot.login(process.env.token);
