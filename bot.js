/*
client ID:
701873854930354287
*/

// ==========IMPORTS AND SETUP==========

const Discord = require('discord.js');
const config = require('./config.json');
const pkg = require('./package.json');

const bot = new Discord.Client();

// ==========END IMPORTS AND SETUP==========


// ==========SETTINGS==========

var prefix = 'cube'; // might add changeable prefixes later
const troll = false;
const ignoreBots = true;
const COOLDOWN = 1000;

// ==========END SETTINGS==========


// ==========SCRAMBLE LOGIC==========

function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

const SIDES = ['U', 'D', 'L', 'R', 'F', 'B'];
const DIR = ['', "'", '2'];

function getScramble(moves) {
  let last = -1;
  let ok = Array(SIDES.length); // ok[i]: whether it is ok to add move SIDES[i] next
  ok.fill(true);
  let res = Array(moves);
  for (let i = 0; i < moves; i++) {
    let x;
    do {
      x = randInt(0, SIDES.length - 1);
    } while (!ok[x]);
    ok[x] = false;
    for (let j = 0; j < SIDES.length; j++) {
      if (j != x && j != (x ^ 1)) {
        ok[j] = true;
      }
    }
    res[i] = SIDES[x] + DIR[randInt(0, 2)];
  }
  return res.join(' ');
}

// ==========END SCRAMBLE LOGIC==========

// ==========TIMER LOGIC==========

function formatTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let res = '';
  if (hours > 0) {
    res += hours + ":";
  }
  if (minutes > 0) {
    minutes %= 60;
    let minString = minutes.toString();
    if (hours > 0) {
      minString = minString.padStart(2, '0');
    }
    res += minString + ':';
  }
  seconds %= 60;
  let secString = seconds.toString();
  if (minutes > 0) {
    secString = secString.padStart(2, '0');
  }
  milliseconds %= 1000;
  res += secString + '.' + milliseconds.toString().padStart(3, '0');
  return res;
}

var timers = new Map(); // map of maps
var curScramble = new Map();

function startTimer(userId, channelId) {
  if (!timers.has(userId)) {
    timers.set(userId, new Map());
  }
  timers.get(userId).set(channelId, Date.now());
}

function hasTimer(userId, channelId) {
  return (timers.has(userId) && timers.get(userId).has(channelId));
}


class SolveEntry {
  constructor(userId, time, scramble) {
    this.userId = userId;
    this.time = time;
    this.scramble = scramble;
  }
}

var pb = new Map();

function checkStop2(channel, user) {
  if (!hasTimer(user.id, channel.id)) {
    return; // this user doesn't have a timer in this channel
  }
  let time = Date.now() - timers.get(user.id).get(channel.id);
  timers.get(user.id).delete(channel.id);
  channel.send(`Timer stopped for ${user.username}; time: ${formatTime(time)}`);
  if (!curScramble.has(user.id)) {
    return; // if user didn't request a scramble, don't consider this for PB
  }
  if (!pb.has(user.id) || time < pb.get(user.id).time) {
    channel.send(`${user.username} got a new personal best of`
      + ` ${formatTime(time)}. Congratulations!`);
    pb.set(user.id, new SolveEntry(user.id, time, curScramble.get(user.id)));
  }
  curScramble.delete(user.id);
}

function checkStop(message) {
  checkStop2(message.channel, message.author);
}

// ==========END TIMER LOGIC==========


// ==========COMMAND LOGIC==========

class Command {
  constructor(names, helpMsg, callback) {
    this.names = names;
    this.helpMsg = helpMsg;
    this.do = callback;
  }

  get helpString() {
    return `\`${prefix} ${this.names.join('/')}\` ${this.helpMsg}`;
  }
}

const COMMANDS = [];

function newCommand(names, helpMsg, callback) {
  COMMANDS.push(new Command(names, helpMsg, callback));
}

// help
newCommand(['help'],  'shows a help scramble',
  function(message) {
    message.channel.send(helpEmbed);
  }
);

// get
newCommand(['get', 'scramble'], 'displays a new scramble', message => {
  let scramble = getScramble(randInt(17, 20));
  let str = `${scramble}\nReact with ${scrambleConfirmEmoji} to use this scramble.`;
  message.channel.send(str).then(async sent => {
    await sent.react(scrambleConfirmEmoji);
    await sent.react(scrambleRemoveEmoji);
  });
});

newCommand(['time', 'start'], 'starts a timer for you',
  function(message) {
    startTimer(message.author.id, message.channel.id);
    message.channel.send(`Timer started for ${message.author.username}. `
      + 'Send anything to stop.');
  }
);

function getPbEmbed() {
  let entries = [];
  pb.forEach(function(entry, userId) {
    entries.push(entry);
  });
  entries.sort(function(e1, e2) {
    if (e1.time < e2.time) {
      return -1;
    }
    if (e1.time > e2.time) {
      return 1;
    }
    return 0;
  });
  let entriesString = 'No personal bests yet. Set one now!';
  if (entries.length > 0) {
    entriesString = entries.map(e => (`<@${e.userId}>: ${formatTime(e.time)}\n`
      + `- scramble: ${e.scramble}`)).join('\n');
  }
  return new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Personal Bests')
    .attachFiles(['./avatar.png'])
    .setThumbnail('attachment://avatar.png')
    .addField('Leaderboard', entriesString)
    .setFooter(`ScrambleBot, version ${pkg.version} | Trademark ${pkg.author}™`);
}

newCommand(['pbs', 'pb'], 'shows the personal bests of all members (not just in this server)',
  function(message) {
    message.channel.send(getPbEmbed());
  }
);

newCommand(['clearpb', 'resetpb'], 'resets your personal best',
  function(message) {
    if (pb.delete(message.author.id)) {
      message.channel.send(`Personal best of ${message.author.username} cleared.`);
    } else {
      message.channel.send(`${message.author.username} did not have an existing personal best.`);
    }
  }
);

newCommand(['clearallpbs', 'resetallpbs'], 'clears all records of personal bests',
  function(message) {
    pb.clear();
    message.channel.send('All personal bests cleared.');
  }
);

const helpEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('ScrambleBot Help')
  .setAuthor(`by ${pkg.author}`)
  .attachFiles(['./avatar.png'])
  .setThumbnail('attachment://avatar.png')
  .addField('Commands (no spaces required)',
    COMMANDS.map(cmd => cmd.helpString).join('\n')
  )
  .setFooter(`ScrambleBot, version ${pkg.version} | Trademark ${pkg.author}™`);


// ==========END COMMAND LOGIC==========


// ==========REACTION LOGIC==========

const scrambleConfirmEmoji = '✅';
const scrambleRemoveEmoji = '❌';

class ReactionAddAction {
  constructor(emoji, callback) {
    this.emoji = emoji;
    this.do = callback;
  }
}

const REACTION_ADD_ACTIONS = [];

function newReactionAddAction(emoji, callback) {
  REACTION_ADD_ACTIONS.push(new ReactionAddAction(emoji, callback));
}

newReactionAddAction(scrambleConfirmEmoji, (messageReaction, user) => {
  const message = messageReaction.message;
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
	for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == scrambleRemoveEmoji) {
  		reaction.users.remove(user.id);
    }
	}
  let lines = message.content.split('\n');
  let scrambleString = lines[0];
  let instructions = lines[1];
  let users = lines.slice(3);
  users.push(`<@${user.id}>`);
  curScramble.set(user.id, scrambleString);
  if (!message.editable) {
    console.log('cannot edit this message');
    return;
  }
  message.edit(`${scrambleString}\n${instructions}\nContenders:\n${users.join('\n')}`);
});

newReactionAddAction(scrambleRemoveEmoji, (messageReaction, user) => {
  const message = messageReaction.message;
  // https://discordjs.guide/popular-topics/reactions.html#removing-reactions-by-user
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
  for (const reaction of userReactions.values()) {
    if (reaction.emoji.name == scrambleConfirmEmoji) {
      reaction.users.remove(user.id);
    }
  }
  let lines = message.content.split('\n');
  let scrambleString = lines[0];
  let instructions = lines[1];
  let tgt = `<@${user.id}>`;
  let users = lines.slice(3).filter(u => u != tgt);
  // console.log('filtered users: ' + users);
  curScramble.delete(user.id);
  if (!message.editable) {
    console.log('cannot edit this message');
    return;
  }
  let edited = `${scrambleString}\n${instructions}`;
  if (users.length != 0) {
    edited += `\nContenders:\n${users.join('\n')}`;
  }
  message.edit(edited);
});

// class ReactionRemoveAction {
//   constructor(emoji, callback) {
//     this.emoji = emoji;
//     this.do = callback;
//   }
// }
//
// const REACTION_REMOVE_ACTIONS = [];
//
// function newReactionRemoveAction(emoji, callback) {
//   REACTION_REMOVE_ACTIONS.push(new ReactionRemoveAction(emoji, callback));
// }
//
// newReactionRemoveAction(scrambleConfirmEmoji, (messageReaction, user) => {
//
// });

// ==========END REACTION LOGIC==========


// ==========BOT CODE==========

bot.on('ready', function() {
  bot.user.setActivity(`${prefix} is my prefix`);
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

bot.on('message', message => {
  if (message.author.id == bot.user.id || (message.author.bot && ignoreBots)) {
    // ignore message if sent by self, or sender is bot and ignoreBots is on
    return;
  }
  // message.react('😄');
  checkStop(message);
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

// figure this out later
// const rc = Discord.ReactionCollector()

bot.on('messageReactionAdd', (messageReaction, user) => {
  // console.log('someone reacted to: ' + messageReaction.message.content);
  if (user.id == bot.user.id) {
    return; // ignore reacts by self
  }
  REACTION_ADD_ACTIONS.forEach(raa => { // related acute angle lol
    if (messageReaction.emoji.name == raa.emoji) {
      raa.do(messageReaction, user);
    }
  });
});

// bot.on('messageReactionRemove', (messageReaction, user) => {
//   // console.log('someone removed a reaction on: ' + messageReaction.message.content);
//   if (user.id == bot.user.id) {
//     return;
//   }
//   REACTION_REMOVE_ACTIONS.forEach(rda => {
//     if (messageReaction.emoji.name == rda.emoji) {
//       rda.do(messageReaction, user);
//     }
//   });
// })

// this is too slow to start/stop the timer accurately
// bot.on('typingStart', function(channel, user) {
//   console.log(user);
//   checkStop2(channel, user);
// });

bot.login(config.token);

// ==========END BOT CODE==========
