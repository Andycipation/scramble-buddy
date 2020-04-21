/*
client ID:
701873854930354287
*/

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

var timers = new Map();

function startTimer(userId, channelId) {
  timers.set(userId, [Date.now(), channelId]);
}

function hasTimer(userId) {
  return timers.has(userId);
}

function hasTimer(userId, channelId) {
  return (timers.has(userId) && timers.get(userId)[1] == channelId);
}

function stopTimer(userId) { // returns the time taken in milliseconds
  if (!timers.has(userId)) {
    return;
  }
  let ret = Date.now() - timers.get(userId)[0];
  timers.delete(userId);
  return ret;
}


// ==========END TIMER LOGIC==========

// ==========BOT CODE==========

const Discord = require('discord.js');
const config = require('./config.json');
const pkg = require('./package.json');
const bot = new Discord.Client();
var prefix = 'cube'; // might add changeable prefixes later

bot.on('ready', function() {
  bot.user.setActivity(`${prefix} is my prefix`);
  // bot.user.setAvatar('./avatar.png');
});

const COMMANDS = [
  [['help'], 'shows a help message'],
  [['get', 'scramble'], 'gets a scramble'],
  [['time', 'start'], 'starts a timer for you']
];

var commandString = COMMANDS.map(function(p) {
  return `\`${prefix} ${p[0].join('/')}\` ${p[1]}`
}).join('\n');

const helpEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('ScrambleBot Help')
  .setAuthor(`by ${pkg.author}`)
  .attachFiles(['./avatar.png'])
  .setThumbnail('attachment://avatar.png')
  .addField('Commands (no spaces required)', commandString)
  .setFooter(`ScrambleBot, version ${pkg.version} | Trademark ${pkg.author}™`);

bot.on('message', function(message) {
  let userId = message.author.id;
  if (userId == bot.user.id) {
    return; // ignore messages sent by self
  }
  // if (message.author.bot) {
  //   return; // ignore messages sent by bots
  // }
  // testing messages
  // message.channel.send(`Your user id is ${message.author.id}.`);
  // message.channel.send(`This channel's id is ${message.channel.id}.`);

  // timer start/stop
  if (hasTimer(userId, message.channel.id)) {
    message.channel.send(`Timer stopped for ${message.author.username}; `
      + `time: ${formatTime(stopTimer(userId))}`);
  }
  let msg = message.content.trim();
  // troll messages
  if (msg.startsWith('Hi!')) {
    message.channel.send('Hi!');
    return;
  }
  if (msg.startsWith('gn')) {
    message.channel.send('Good night!');
    return;
  }
  // actual functionality
  if (!msg.startsWith(prefix)) {
    return;
  }
  let args = msg.substring(prefix.length).trim().toLowerCase().split(' ');
  let cmd = args[0];
  if (cmd == 'help') {
    message.channel.send(helpEmbed);
  } else if (cmd == 'get' || cmd == 'scramble') {
    message.channel.send(getScramble(20));
  } else if (cmd == 'time' || cmd == 'start') {
    // if (hasTimer(userId)) { // function overloading not working now
    //   message.channel.send('Existing timer stopped.');
    // }
    startTimer(userId, message.channel.id);
    message.channel.send(`Timer started for ${message.author.username}. Start typing or send anything to stop.`);
  }
});

// this is too slow to start/stop the timer accurately
bot.on('typingStart', function(channel, user) {
  // channel.send(`${user.username} started typing.`);
  if (hasTimer(user.id, channel.id)) {
    channel.send(`Timer stopped for ${user.username}; `
      + `time: ${formatTime(stopTimer(user.id))}`);
  }
});

bot.login(config.token);

// ==========END BOT CODE==========
