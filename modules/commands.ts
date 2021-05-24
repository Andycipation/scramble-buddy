/*
The commands that the bot responds to.
*/

import config from '../config';

import pkg = require('../package.json');
import fs = require('fs');

import db = require('./database');
import { getScramble, makeImage } from './scramble';
import solves = require('./solves');
import timer = require('./timer');
import { getDateString, parseCommand } from './util';

import assert = require('assert');
import { Message, MessageOptions, Snowflake } from 'discord.js';

/**
 * A class representing a Command that can be called by the user.
 */
class Command {
  public name: string;
  public helpMsg: string;
  public do: (message: Message) => void;
  /**
   * The constructor for a Command object.
   * @param name the token that will trigger this command
   * @param helpMsg the message shown in the help embed
   * @param callback the function that executes when the command is called
   */
  constructor(name: string, helpMsg: string, callback: (message: Message) => void) {
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


const COMMANDS = new Map<string, Command>();

/**
 * Adds a new Command to the COMMANDS Map, which is exported to the bot.js file.
 * @param name the token that will trigger this command
 * @param helpMsg the message shown in the help embed
 * @param callback the function that executes when the command is called
 */
function newCommand(name: string, helpMsg: string, callback: (message: Message) => void) {
  COMMANDS.set(name, new Command(name, helpMsg, callback));
}

// ========== COMMAND DEFINITIONS ==========

// help
newCommand('help', 'shows this help message', message => {
  message.channel.send({ embed: getHelpEmbed() });
});

const inSolveMode = new Set<Snowflake>([config.MY_DISCORD_ID]);
newCommand('solvemode', 'enters solve mode (no prefix required to call commands)', message => {
  inSolveMode.add(message.author.id);
  // TODO: change these to reply?
  message.channel.send(`${message.author.username}, you no longer need `
      + `the prefix \`${config.prefix}\` to call ${config.BOT_NAME} commands.`);
});
newCommand('exitsolvemode', 'exits solve mode', message => {
  inSolveMode.delete(message.author.id);
  message.channel.send(`${message.author.username}, you now need `
      + `the prefix \`${config.prefix}\` to call ${config.BOT_NAME} commands.`);
});

// get a scramble
newCommand('get', 'generates a new scramble', async message => {
  const filename = `./assets/${message.id}.png`;
  const scramble = await getScramble(filename);
  timer.setScramble(message.author.id, scramble);
  // add the sender automatically
  const str = `${scramble}\n`
      + `${config.SCRAMBLE_REACT_PROMPT}\n`
      + `Contenders:\n`
      + `<@${message.author.id}>`;
  const options: MessageOptions = {};
  if (config.MAKE_SCRAMBLE_IMAGES) {
    options.files = [filename];
  }
  setTimeout(() => {
    message.channel.send(str, options).then(async sent => {
      assert(sent instanceof Message);
      await sent.react(config.CONFIRM_EMOJI);
      await sent.react(config.REMOVE_EMOJI);
      if (config.MAKE_SCRAMBLE_IMAGES) {
        fs.unlinkSync(filename);
      }
    });
  }, 100);
});

const inspecting = new Map();

const NOTIFICATIONS = [8, 12];  // notify when 8 and 12 seconds have passed
const WARNINGS = [15, 17];  // warn at 15 and 17 seconds (> 17 seconds is a DNF)

// start inspection
newCommand('inspect', 'begins your inspection timer', async message => {
  const userId = message.author.id;
  const username = message.author.username;
  if (inspecting.has(userId)) {
    message.reply('You currently have an inspecting timer running.');
    return;
  }
  const startTime = Date.now();
  inspecting.set(userId, startTime);  // set the start time
  message.reply('Your inspection timer has begun. You have 15 seconds.');

  // prepare warning replies
  for (const s of NOTIFICATIONS) {
    setTimeout(() => {
      // Map#get returns undefined if the key is not present
      if (inspecting.get(userId) == startTime) {
        message.channel.send(`${username}, ${s} seconds have gone by.`);
      }
    }, s * 1000);  // times 1000 because in milliseconds
  }
  
  // notify if the user is "getting penalized" (according to WCA regulations:
  // https://www.worldcubeassociation.org/regulations/)
  for (const s of WARNINGS) {
    setTimeout(() => {
      if (inspecting.get(userId) == startTime) {
        message.channel.send(`${username}, you have used ${s} seconds of inspection!`);
      }
    }, s * 1000);
  }
});

// start timer
newCommand('go', 'starts a timer for you', message => {
  const userId = message.author.id;
  let reply = '';
  if (inspecting.has(userId)) {
    const startTime = inspecting.get(userId);
    inspecting.delete(userId);
    const inspectionTime = Date.now() - startTime;
    reply += `Your inspection time was ${timer.formatTime(inspectionTime, false)}. `;
  }
  reply += 'Your timer has started. Send anything to stop.';
  timer.startTimer(message.author.id, message.channel.id);
  message.reply(reply);
});

// view user's current records
newCommand('view', '`[user mention] [page]` shows user profile', message => {
  let user = message.mentions.users.first();
  if (user != null && (user.bot && config.IGNORE_BOTS)) {
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
    message.channel.send(`Invalid page number provided.`);
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

newCommand('viewsolve', "`[user mention] [solve number]` view user's solve", async message => {
  // massive copy-paste from "cube view" command but whatever
  let user = message.mentions.users.first();
  if (user != null && (user.bot && config.IGNORE_BOTS)) {
    message.channel.send("You cannot request to view a bot's solves.");
    return;
  }
  if (user == null) {
    user = message.author;
  }
  const solver = solves.getSolver(user.id);
  if (solver.solves.empty()) {
    message.channel.send(`${user.username} does not yet have an existing solve.`);
    return;
  }
  let solve = solver.solves.size() - 1;
  let args = parseCommand(message.content);
  for (let j = 1; j <= 2; ++j) {
    // check all possible optional command arguments
    let x = parseInt(args[j], 10);
    if (!isNaN(x)) {
      solve = x - 1;
      break;
    }
  }
  if (solve < 0 || solve >= solver.solves.size()) {
    message.channel.send(`Invalid solve number provided: ${solve + 1}`);
    return;
  }
  const se = solver.solves.at(solve);
  const str = `**Details for solve ${solve + 1} of ${user.username}**\n`
      + `${se.toString()}\n`
      + `Time the solve was completed: ${getDateString(se.completed)}`;
  const filename = `./assets/${message.id}.png`;
  makeImage(se.scramble, filename);
  const options: MessageOptions = {};
  if (config.MAKE_SCRAMBLE_IMAGES) {
    options.files = [filename];
  }
  setTimeout(() => {
    message.channel.send(str, options).then(async sent => {
      if (config.MAKE_SCRAMBLE_IMAGES) {
        fs.unlinkSync(filename);
      }
    });
  }, 100);
});

// set the method used by user
newCommand('setmethod', '`[method]` sets your solving method in your profile', async message => {
  const args = parseCommand(message.content);
  const method = args.slice(1).join(' ');
  if (method.length == 0) {
    message.channel.send(message.author.username
        + ', you must provide a solving method, e.g. `cube setmethod CFOP`.');
    return;
  }
  if (await db.setMethod(message.author.id, method)) {
    message.channel.send(`${message.author.username}, your solving method has been set to ${method}.`);
  } else {
    message.channel.send('Invalid method provided; solving method unchanged.');
  }
});

newCommand('remove', 'removes your last solve', message => {
  const solver = solves.getSolver(message.author.id);
  if (!solver.solves.empty()) {
    const lastSolve = solver.getLastSolve();
    assert(db.popSolve(message.author.id));
    message.channel.send(message.author.username + ', your last solve has been removed.\n'
        + 'The removed solve is shown below:\n'
        + lastSolve.toString());
  } else {
    message.channel.send(`${message.author.username}, you do not have an existing solve.`);
  }
});

newCommand('+2', 'changes whether your last solve was a +2', message => {
  const solver = solves.getSolver(message.author.id);
  if (db.togglePlusTwo(message.author.id)) {
    let se = solver.getLastSolve();
    message.channel.send(`${message.author.username}, `
        + `+2 was ${se.plusTwo ? 'added to' : 'removed from'} your last solve.\n`
        + `The modified solve entry is shown below:\n${se.toString()}`);
  } else {
    message.channel.send(`${message.author.username}, `
        + `you do not have an existing solve.`);
  }
});


/**
 * Returns a MessageEmbed containing the leaderboard, ranked by personal
 * bests. This function must be above the newCommand declaration for
 * the 'cube pb' command.
 * @returns the leaderboard embed
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
        inline: false,
      },
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

// string with all commands and their descriptions
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
        inline: false,
      },
    ],
    timestamp: new Date(),
    footer: {
      text: config.FOOTER_STRING,
    },
  };
}


const lastRequest = new Map();

/**
 * Checks if the user with the given id can make a request to the bot.
 * @param {string} userId the id of the user to check
 * @returns {boolean} whether or not the user can make a request at this time
 */
function canRequest(userId: string): boolean {
  return (!lastRequest.has(userId) || Date.now() - lastRequest.get(userId) >= config.COOLDOWN);
}

export async function handleCommand(message: Message) {
  const userId = message.author.id;
  if (!canRequest(userId)) {
    return; // message was "spammed" too quickly
  }
  if (!message.content.startsWith(config.prefix) && !inSolveMode.has(userId)) {
    return; // not a command
  }
  lastRequest.set(userId, Date.now()); // reset cooldown

  // do the actual command if applicable
  const op = parseCommand(message.content)[0];
  COMMANDS.get(op)?.do(message);
}
