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
    res += minutes + ":";
  }
  res += milliseconds / 1000;
  return res;
}

// ==========END TIMER LOGIC==========

// ==========BOT CODE==========

const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client();
var prefix = 'cube'; // might add changeable prefixes later

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

var timers = new Map();

bot.on('message', function(message) {
  if (message.author.bot) {
    return;
  }
  if (timers.has(message.author.id)) {
    let time = formatTime(Date.now() - timers.get(message.author.id));
    message.channel.send(`Timer stopped for ${message.author.username}; time: ${time}`);
    timers.delete(message.author.id);
  }
  let msg = message.content.trim();
  if (msg.startsWith('Hi!')) {
    message.channel.send('Hi!');
    return;
  }
  if (msg.startsWith('gn')) {
    message.channel.send('Good night!');
    return;
  }
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
    timers.set(message.author.id, Date.now());
    message.channel.send(`Timer started for ${message.author.username}.`);
  }
});

bot.login(config.token);

// ==========END BOT CODE==========
