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
  let res = Array(moves);
  let ok = Array(6); // ok[i]: whether it is ok to add move SIDES[i] next
  ok.fill(true);
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


// ==========BOT CODE==========

const Discord = require('discord.js');
const config = require('./config.json');
const bot = new Discord.Client();
var botPrefix = 'cube'; // might add changeable prefixes later

bot.on('message', function(message) {
  if (message.author.bot) {
    return;
  }
  let msg = message.content.trim();
  if (msg.startsWith('Hi!')) {
    message.channel.send('Hi!');
    return;
  }
  if (!msg.startsWith(botPrefix)) {
    return;
  }
  msg = msg.substring(botPrefix.length).trim().toLowerCase();
  if (msg == 'get') {
    message.channel.send(getScramble(20));
  }
});

bot.login(config.token);

// ==========END BOT CODE==========
