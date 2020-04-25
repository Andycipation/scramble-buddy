/*
The commands which the bot responds to.
*/

const Discord = require('discord.js');
const pkg = require('../package.json');

const {
  prefix,
  scrambleRemoveEmoji,
  scrambleConfirmEmoji,
  FOOTER_STRING
} = require('../settings.js');
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
  message.channel.send({ embed: helpEmbed });
});

// get
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
  let pbStr;
  if (pbs.length > 0) {
    pbStr = pbs.map(e => `<@${e.userId}>: ${e.string}`).join('\n');
  } else {
    pbStr = 'No personal bests yet. Set one now!';
  }
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
        value: pbStr
      }
    ],
    timestamp: new Date(),
    footer: {
      text: FOOTER_STRING
    }
  };
}

// view user's current records
newCommand(['view'], '`[user mention]`shows data for the given user', message => {
  let msg = message.content.trim().substring(prefix.length).trim();
  // console.log(msg);
  let args = msg.split(' ');
  if (args[0] != 'view' && args[0] != 'profile') {
    console.log('no idea how this happened');
  }
  let user = message.mentions.users.first();
  if (user == null || user.bot) {
    message.channel.send('The user mentioned in the message is invalid.');
    return;
  }
  let userId = message.mentions.users.first().id;
  message.channel.send({ embed: solves.getUserEmbed(userId) });
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
newCommand(['pbs', 'pb'], 'shows the personal bests of all members (not just members in this server)',
  message => {
    message.channel.send({ embed: getPbEmbed() });
  }
);

// clear your personal best
// newCommand(['clearpb', 'resetpb'], 'resets your personal best', message => {
//   if (solves.deletePb(message.author.id)) {
//     message.channel.send(`Personal best of ${message.author.username} cleared.`);
//   } else {
//     message.channel.send(`${message.author.username} did not have an existing personal best.`);
//   }
// });

// clear all personal bests
// newCommand(['clearallpbs', 'resetallpbs'], 'clears all records of personal bests',
//   message => {
//     solves.clearAllPbs();
//     message.channel.send('All personal bests cleared.');
//   }
// );

var helpEmbed = {
  color: 0x0099ff,
  title: pkg.name,
  author: {
    name: `by ${pkg.author}`
  },
  description: 'a Discord bot for cubers',
  // files: ['./assets/avatar.png'],
  // thumbnail: {
  //   url: 'attachment://avatar.png'
  // },
  fields: [
    {
      name: 'Commands (no spaces required)',
      value: COMMANDS.map(cmd => cmd.helpString).join('\n')
    }
  ],
  timestamp: new Date(),
  footer: {
    text: FOOTER_STRING
  }
};


exports.COMMANDS = COMMANDS;
