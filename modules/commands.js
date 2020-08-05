/*
The commands which the bot responds to.
*/


const Discord = require('discord.js');
const pkg = require('../package.json');

const {
  prefix,
  scrambleRemoveEmoji,
  scrambleConfirmEmoji,
  FOOTER_STRING,
  LEADERBOARD_LENGTH,
} = require('../config.js');

const { getScramble } = require('./scramble.js');
const solves = require('./solves.js');
const timer = require('./timer.js');

class Command {
  constructor(names, helpMsg, callback) {
    this.names = names;
    this.helpMsg = helpMsg;
    this.do = callback;
  }

  get helpString() {
    // maybe prefix shouldn't even be in this file
    return `\`${prefix} ${this.names.join('/')}\` ${this.helpMsg}`;
  }
}

const COMMANDS = [];

function newCommand(names, helpMsg, callback) {
  COMMANDS.push(new Command(names, helpMsg, callback));
}

// help
newCommand(['help'], 'shows this help message', message => {
  message.channel.send({ embed: getHelpEmbed() });
});

// get a scramble
newCommand(['get', 'scramble'], 'displays a new scramble', message => {
  let scramble = getScramble();
  let str = `${scramble}\nReact with ${scrambleConfirmEmoji} to use this scramble.`;
  message.channel.send(str).then(async sent => {
    await sent.react(scrambleConfirmEmoji);
    await sent.react(scrambleRemoveEmoji);
  });
  // console.log('scramble sent');
});

// start timer
newCommand(['time', 'start', 'go'], 'starts a timer for you', message => {
  timer.startTimer(message.author.id, message.channel.id);
  message.channel.send(`Timer started for ${message.author.username}. `
    + 'Send anything to stop.');
});

function getPbEmbed() {
  let pbs = solves.getCurrentPbs();
  pbs.sort((e1, e2) => {
    if (e1.time < e2.time) return -1;
    if (e1.time > e2.time) return 1;
    return 0;
  });
  pbs.length = Math.min(pbs.length, LEADERBOARD_LENGTH);
  let strings = [];
  for (let i = 0; i < pbs.length; i++) {
    strings.push(`${i + 1}. ${`<@${pbs[i].userId}>: ${pbs[i]}`}`)
  }
  if (strings.length == 0) {
    strings.push('No one has a personal best yet. Be the first to have one!');
  }
  let pbStr = strings.join('\n');
  return {
    color: 0x0099ff,
    title: 'Personal Bests',
    // files: ['./assets/avatar.png'],
    // thumbnail: {
    //   url: 'attachment://avatar.png'
    // },
    fields: [
      {
        name: 'Leaderboard',
        value: pbStr,
      }
    ],
    timestamp: new Date(),
    footer: {
      text: FOOTER_STRING,
    },
  };
}

// view user's current records
newCommand(['view'], '`[user mention]`shows data for the given user', message => {
  let msg = message.content.trim().substring(prefix.length).trim();
  let args = msg.split(' ');
  let user = message.mentions.users.first();
  if (user != null && user.bot) {
    message.channel.send("You cannot request to view a bot's solves.");
    return;
  }
  if (user == null) {
    user = message.author;
  }
  message.channel.send({ embed: solves.getUserEmbed(user.id) });
});

// remove the last solve; maybe remove 'clearPb' stuff below
newCommand(['remove', 'pop'], 'removes your last solve', message => {
  if (solves.popSolve(message.author.id)) {
    message.channel.send(`Last solve of ${message.author.username} removed.`);
  } else {
    message.channel.send(`${message.author.username} does not have an existing solve.`);
  }
});

// show personal bests
newCommand(['pbs', 'pb'], 'shows the personal bests of all members',
  message => {
    message.channel.send({ embed: getPbEmbed() });
  }
);

// use function to recalculate timestamp; otherwise, the timestamp remains at the
// time which the bot was last put online
function getHelpEmbed() {
  return {
    color: 0x0099ff,
    title: pkg.name,
    // author: {
    //   name: `by ${pkg.author}`
    // },
    description: pkg.description,
    // files: ['./assets/avatar.png'],
    // thumbnail: {
    //   url: 'attachment://avatar.png'
    // },
    fields: [
      {
        name: 'Commands (no spaces required)',
        value: COMMANDS.map(cmd => cmd.helpString).join('\n'),
      }
    ],
    timestamp: new Date(),
    footer: {
      text: FOOTER_STRING,
    },
  };
}


exports.COMMANDS = COMMANDS;
