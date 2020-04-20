/*
Taken from the following article:
https://www.digitaltrends.com/gaming/how-to-make-a-discord-bot/
*/

const Discord = require('discord.js');
const logger = require('winston');
const config = require('./config.json');
const botPrefix = config.prefix;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
  token: config.token,
  autorun: true
});

console.log(config.token);

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

bot.on('message', function(msg) {
  console.log(msg.content);
  return;
  if (!msg.startsWith(botPrefix)) {
    return;
  }
  msg = msg.substring(botPrefix.length);
  if (msg.charAt(0) == '3') {
    // bot.sendMessage({
    //   to: channelId,
    //   message: getScramble(20)
    // });
  }
});
