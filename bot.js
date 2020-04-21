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
    res += minutes.padStart(2, '0') + ':';
  }
  seconds %= 60;
  milliseconds %= 1000;
  res += seconds.padStart(2, '0') + '.' + milliseconds;
  return res;
}

var timers = new Map();

function stopTimer(id) { // returns the time taken in milliseconds
  if (!timers.has(id)) {
    return -1;
  }
  let ret = Date.now() - timers.get(id);
  timers.delete(id);
  return ret;
}

const BASE = 1000000000;
function startTimer(userId, channelId) {
  // let id = BASE * channelId + userId;
  let id = userId;
  timers.set(id, Date.now());
}

// ==========END TIMER LOGIC==========

// ==========BOT CODE==========

const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client();
var prefix = 'cube'; // might add changeable prefixes later
bot.setGame(`My prefix is ${prefix}`);

const helpEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('ScrambleBot Help')
  .setAuthor('by ADMathNoob')
  .setThumbnail('https://www.mindgamesbrisbane.com/wp-content/uploads/2019/03/9352214721600.jpg')
  // .attachFiles(['../avatar.jpg'])
  // .setThumbnail('attachment://avatar.jpg')
  .addField('Commands (no spaces required)',
    `- ${prefix} help: shows this message`
    + `\n- ${prefix} get: gets a scramble for 3x3`
    + `\n- ${prefix} time: starts a timer for you; sending any message will stop it`
  )
  .setFooter('Trademark ADMathNoob™');

bot.on('message', function(message) {
  if (message.author.bot) {
    return; // ignore messages set by bots
  }
  // testing messages
  message.channel.send(`Your user id is ${message.author.id}.`);
  message.channel.send(`This channel's id is ${message.channel.id}.`);

  // timer start/stop
  let time = stopTimer(message.author.id);
  if (time != -1) {
    message.channel.send(`Timer stopped for ${message.author.username}; time: ${formatTime(time)}`);
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
  } else if (cmd == 'get') {
    message.channel.send(getScramble(20));
  } else if (cmd == 'time') {
    startTimer(message.author.id, message.channel.id);
    message.channel.send(`Timer started for ${message.author.username}.`);
  }
});

bot.login(config.token);

// ==========END BOT CODE==========
