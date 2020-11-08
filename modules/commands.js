/*
The commands that the bot responds to.
*/


const pkg = require('../package.json');
const config = require('../config.js');

const db = require('./database.js');
const { getScramble } = require('./scramble.js');
const solves = require('./solves.js');
const timer = require('./timer.js');
const { parseCommand } = require('./util.js');

const { MessageEmbed } = require('discord.js');


/**
 * A class representing a Command that can be called by the user.
 */
class Command {
  /**
   * The constructor for a Command object.
   * @param {string} name the token that will trigger this command
   * @param {string} helpMsg the message shown in the help embed
   * @param {Function} callback the function that executes when the command is called
   */
  constructor(name, helpMsg, callback) {
    this.name = name;
    this.helpMsg = helpMsg;
    this.do = callback;
  }

  /**
   * Returns the string that appears in the help embed for this command.
   */
  get helpString() {
    // maybe config.prefix shouldn't even be in this file
    return `\`${config.prefix} ${this.name}\` ${this.helpMsg}`;
  }
}


const COMMANDS = new Map();

/**
 * Adds a new Command to the COMMANDS Map, which is exported to the bot.js file.
 * @param {string} name the token that will trigger this command
 * @param {string} helpMsg the message shown in the help embed
 * @param {Function} callback the function that executes when the command is called
 */
function newCommand(name, helpMsg, callback) {
  COMMANDS.set(name, new Command(name, helpMsg, callback));
}

// ========== COMMAND DEFINITIONS ==========

// help
newCommand('help', 'shows this help message', message => {
  message.channel.send({ embed: getHelpEmbed() });
});

const inSolveMode = new Set();
newCommand('solvemode', 'enters solve mode (no prefix required to call commands)', message => {
  inSolveMode.add(message.author.id);
  message.channel.send(`${message.author.username}, you no longer need `
      + `the prefix \`${config.prefix}\` to call ${config.BOT_NAME} commands.`);
});

newCommand('exitsolvemode', 'exits solve mode', message => {
  inSolveMode.delete(message.author.id);
  message.channel.send(`${message.author.username}, you now need `
      + `the prefix \`${config.prefix}\` to call ${config.BOT_NAME} commands.`);
});

// get a scramble
newCommand('get', 'generates a new scramble', message => {
  let scramble = getScramble();
  // add the sender automatically
  timer.setScramble(message.author.id, scramble);
  let str = `${scramble}\n${config.SCRAMBLE_REACT_PROMPT}\nContenders:\n<@${message.author.id}>`;
  message.channel.send(str).then(async sent => {
    await sent.react(config.CONFIRM_EMOJI);
    await sent.react(config.REMOVE_EMOJI);
  });
});

// start timer
newCommand('go', 'starts a timer for you', message => {
  timer.startTimer(message.author.id, message.channel.id);
  message.channel.send(`Timer started for ${message.author.username}. `
    + 'Send anything to stop.');
});

// view user's current records
newCommand('view', '`[user mention] [page]` shows user profile', message => {
  let user = message.mentions.users.first();
  if (user != null && user.bot) {
    message.channel.send("You cannot request to view a bot's solves.");
    return;
  }
  if (user == null) {
    user = message.author;
  }
  let args = parseCommand(message.content);
  let page = 0;
  for (let j = 1; j <= 2; ++j) {
    // check all possible optional command arguments
    let x = parseInt(args[j], 10);
    if (!isNaN(x)) {
      page = x - 1;
      break;
    }
  }
  const embed = solves.getSolverEmbed(user.id, page);
  if (embed === null) {
    message.channel.send('Invalid page number.');
    return;
  }
  message.channel.send({ embed: embed }).then(async sent => {
    // collect reactions for moving left or right
    await sent.react(config.FIRST_EMOJI);
    await sent.react(config.LEFT_EMOJI);
    await sent.react(config.REFRESH_EMOJI);
    await sent.react(config.RIGHT_EMOJI);
    await sent.react(config.LAST_EMOJI);
  });
});

// set the method used by user
newCommand('setmethod', '`[method]` sets your solving method in your profile', async message => {
  const args = parseCommand(message.content);
  const method = args.slice(1).join(' ');
  // console.log(method);
  if (method.length == 0) {
    message.channel.send('You must provide a solving method, e.g. `cube setmethod CFOP`.');
    return;
  }
  if (await db.setMethod(message.author.id, method)) {
    message.channel.send(`Solving method of ${message.author.username} set to ${method}.`);
  } else {
    message.channel.send('Invalid method provided; solving method unchanged.');
  }
});

newCommand('remove', 'removes your last solve', message => {
  if (db.popSolve(message.author.id)) {
    message.channel.send(`Last solve of ${message.author.username} removed.`);
  } else {
    message.channel.send(`${message.author.username} does not have an existing solve.`);
  }
});

newCommand('+2', 'changes whether your last solve was a +2', message => {
  const solver = solves.getSolver(message.author.id);
  if (db.togglePlusTwo(message.author.id)) {
    let se = solver.getLastSolve();
    message.channel.send(`+2 was ${se.plusTwo ? 'added to' : 'removed from'} `
        + `${message.author.username}'s last solve.`);
  } else {
    message.channel.send(`${message.author.username} does not have an existing solve.`);
  }
});


/**
 * Returns a MessageEmbed containing the leaderboard, ranked by personal
 * bests. This function must be above the newCommand declaration for
 * the 'cube pb' command.
 * @returns {MessageEmbed} the leaderboard embed
 */
function getPbEmbed() {
  let pbs = solves.getCurrentPbs();
  pbs.sort((e1, e2) => {
    if (e1.time < e2.time) return -1;
    if (e1.time > e2.time) return 1;
    return 0;
  });
  pbs.length = Math.min(pbs.length, config.LEADERBOARD_LENGTH);
  let strings = [];
  // TODO: don't mention them, just use their username to avoid the
  // ugly snowflake if a viewer is not friends
  // e.g. https://cdn.discordapp.com/attachments/701904186081804320/772957988763074570/unknown.png
  for (let i = 0; i < pbs.length; ++i) {
    strings.push(`${i + 1}) ${`<@${pbs[i].userId}>: ${pbs[i]}`}`)
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
      text: config.FOOTER_STRING,
    },
  };
}

// show personal bests
newCommand('pbs', 'shows the personal bests of all members', message => {
  message.channel.send({ embed: getPbEmbed() });
});

// ========== END COMMAND DEFINITIONS ==========

const COMMANDS_STRING = Array.from(COMMANDS.values()).map(cmd => cmd.helpString).join('\n');

/**
 * Returns a MessageEmbed containing the help strings for each command.
 * @returns {MessageEmbed} the help embed
 */
function getHelpEmbed() {
  return {
    color: 0x0099ff,
    title: config.BOT_NAME,
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
        name: 'Commands (no space required directly after `cube`)',
        value: COMMANDS_STRING,
      },
    ],
    timestamp: new Date(),
    footer: {
      text: config.FOOTER_STRING,
    },
  };
}


exports.COMMANDS = COMMANDS;
exports.inSolveMode = inSolveMode;
