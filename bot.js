/*
Taken from the following article:
https://www.digitaltrends.com/gaming/how-to-make-a-discord-bot/
*/

var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
  token: auth.token,
  autorun: true
});

bot.on('ready', function(evt) {
  logger.info('ScrambleBot connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');
});

// ==========SCRAMBLE LOGIC==========

function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

const SIDES = ['U', 'D', 'L', 'R', 'F', 'B'];
let ok = Array(6);
const DIR = ['', "'", '2'];

function getScramble(moves) {
  let last = -1;
  let res = [];
  for (let i = 0; i < SIDES.length; i++) {
    ok[i] = true;
  }
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
    res.push(SIDES[x] + DIR[randInt(0, 2)]);
  }
  return res.join(' ');
}

// ==========END SCRAMBLE LOGIC==========

bot.on('message', function(user, userId, channelId, msg, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (msg.charAt(0) != '!') {
    return;
  }
  msg = msg.substring(1);
  if (msg.charAt(0) == '3') {
    bot.sendMessage({
      to: channelId,
      message: getScramble(20)
    });
  }
});
