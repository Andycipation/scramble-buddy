/*
The commands which the bot responds to.
*/

const Discord = require('discord.js');
const pkg = require('../package.json');

const { prefix, scrambleRemoveEmoji, scrambleConfirmEmoji } = require('../settings.js');
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
  message.channel.send(helpEmbed);
});

// get
newCommand(['get', 'scramble'], 'displays a new scramble', message => {
  let scramble = getScramble();
  let str = `${scramble}\nReact with ${scrambleConfirmEmoji} to use this scramble.`;
  message.channel.send(str).then(async sent => {
    await sent.react(scrambleConfirmEmoji);
    await sent.react(scrambleRemoveEmoji);
  });
});

// start timer
newCommand(['time', 'start', 'go'], 'starts a timer for you', message => {
  timer.startTimer(message.author.id, message.channel.id);
  message.channel.send(`Timer started for ${message.author.username}. `
    + 'Send anything to stop.');
});

function getPbEmbed() {
  let entries = Array.from(solves.getPbs().values());
  entries.sort((e1, e2) => {
    if (e1.time < e2.time) {
      return -1;
    }
    if (e1.time > e2.time) {
      return 1;
    }
    return 0;
  });
  let entriesString;
  if (entries.length > 0) {
    entriesString = entries.map(e => e.string).join('\n');
  } else {
    entriesString = 'No personal bests yet. Set one now!';
  }
  return new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Personal Bests')
    .attachFiles(['./assets/avatar.png'])
    .setThumbnail('attachment://assets/avatar.png')
    .addField('Leaderboard', entriesString)
    .setFooter(`ScrambleBot, version ${pkg.version} | Trademark ${pkg.author}™`);
}

// show personal bests
newCommand(['pbs', 'pb'], 'shows the personal bests of all members (not just in this server)',
  message => {
    message.channel.send(getPbEmbed());
  }
);

// clear your personal best
newCommand(['clearpb', 'resetpb'], 'resets your personal best', message => {
  if (solves.deletePb(message.author.id)) {
    message.channel.send(`Personal best of ${message.author.username} cleared.`);
  } else {
    message.channel.send(`${message.author.username} did not have an existing personal best.`);
  }
});

// clear all personal bests
newCommand(['clearallpbs', 'resetallpbs'], 'clears all records of personal bests',
  message => {
    solves.clearAllPbs();
    message.channel.send('All personal bests cleared.');
  }
);

const helpEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('ScrambleBot Help')
  .setAuthor(`by ${pkg.author}`)
  .attachFiles(['./assets/avatar.png'])
  .setThumbnail('attachment://assets/avatar.png')
  .addField('Commands (no spaces required)',
    COMMANDS.map(cmd => cmd.helpString).join('\n')
  )
  .setFooter(`ScrambleBot, version ${pkg.version} | Trademark ${pkg.author}™`);


exports.COMMANDS = COMMANDS;
