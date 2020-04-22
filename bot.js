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
  res += secString + '.' + milliseconds;
  return res;
}

var timers = new Map(); // map of maps

function startTimer(userId, channelId) {
  if (!timers.has(userId)) {
    timers.set(userId, new Map());
  }
  timers.get(userId).set(channelId, Date.now());
}

function hasTimer(userId, channelId) {
  return (timers.has(userId) && timers.get(userId).has(channelId));
}


var pb = new Map();

function checkStop(message) {
  if (!hasTimer(message.author.id, message.channel.id)) {
    return;
  }
  let time = Date.now() - timers.get(message.author.id).get(message.channel.id);
  timers.get(message.author.id).delete(message.channel.id);
  if (timers.get(message.author.id) == 0) {
    timers.delete(message.author.id);
  }
  message.channel.send(`Timer stopped for ${message.author.username}; `
    + `time: ${formatTime(time)}`);
  if (!pb.has(message.author.id) || time < pb.get(message.author.id)) {
    message.channel.send(`${message.author.username} got a new personal best of`
      + ` ${formatTime(time)}. Congratulations!`);
    pb.set(message.author.id, time);
  }
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
newCommand(['get', 'scramble'], 'displays a new scramble',
  function(message) {
    message.channel.send(getScramble(randInt(17, 20)));
  }
);

newCommand(['time', 'start'], 'starts a timer for you',
  function(message) {
    startTimer(message.author.id, message.channel.id);
    message.channel.send(`Timer started for ${message.author.username}. `
      + 'Send anything to stop.');
  }
);

function getPbEmbed() {
  let entries = [];
  pb.forEach(function(time, userId) {
    entries.push([time, userId]);
  });
  entries.sort();
  let entriesString = 'No personal bests yet. Set one now!';
  if (entries.length > 0) {
    entriesString = entries.map(e => `<@${e[1]}>: ${formatTime(e[0])}`).join('\n');
  }
  return new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Personal Bests')
    .attachFiles(['./avatar.png'])
    .setThumbnail('attachment://avatar.png')
    .addField('Leaderboard', entriesString)
    .setFooter(`ScrambleBot, version ${pkg.version} | Trademark ${pkg.author}™`);
}

newCommand(['pb'], 'shows the personal bests of members in this server',
  function(message) {
    message.channel.send(getPbEmbed());
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

// ==========BOT CODE==========

bot.on('ready', function() {
  bot.user.setActivity(`${prefix} is my prefix`);
  // bot.user.setAvatar('./avatar.png');
  if (troll) {
    timers.set('199904392504147968', [Date.now() - 423784880, '694345248163233835']);
  }
});

bot.on('message', function(message) {
  let userId = message.author.id;
  if (userId == bot.user.id || (message.author.bot && ignoreBots)) {
    // ignore message if sent by self, or sender is bot and ignoreBots is on
    return;
  }

  // testing messages
  // message.channel.send(`Your user id is ${message.author.id}.`);
  // message.channel.send(`This channel's id is ${message.channel.id}.`);
  // console.log('timers: ');
  // console.log(timers);

  // timer start/stop
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
  if (!msg.startsWith(prefix)) {
    return;
  }
  let args = msg.substring(prefix.length).trim().toLowerCase().split(' ');
  let op = args[0];
  COMMANDS.forEach(function(cmd) {
    if (cmd.names.includes(op)) {
      cmd.do(message);
    }
  });
});

// this is too slow to start/stop the timer accurately
// bot.on('typingStart', function(channel, user) {
//   // channel.send(`${user.username} started typing.`);
//   if (hasTimer(user.id, channel.id)) {
//     channel.send(`Timer stopped for ${user.username}; `
//       + `time: ${formatTime(stopTimer(user.id))}`);
//   }
// });

bot.login(config.token);

// ==========END BOT CODE==========
