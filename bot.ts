/*
The driver for the bot.

lol note about package.json:
https://stackoverflow.com/questions/48972663/how-do-i-compile-typescript-at-heroku-postinstall
*/

// config and parameters
import pkg from "./package.json";
import config from "./config";

import {
  Client,
  CommandInteraction,
  Intents,
  Interaction,
  Message,
  MessageEmbed,
  MessageReaction,
  TextChannel,
  User,
} from "discord.js";

import * as actionsTroll from "./bot_modules/trollActions";
import { loadSolves } from "./bot_modules/database";
import { REACTION_ADD_ACTIONS } from "./bot_modules/reactions";
import { getSolver } from "./bot_modules/solves";
import * as timer from "./bot_modules/timer";

// command imports
import get from "./commands/get";
import go from "./commands/go";
import inspect from "./commands/inspect";
import pbs from "./commands/pbs";
import ping from "./commands/ping";
import plustwo from "./commands/plustwo";
import remove from "./commands/remove";
import setmethod from "./commands/setmethod";
import view from "./commands/view";
import viewsolve from "./commands/view_solve";
import Command from "./interface/command";

const help: Command = {
  name: "help",
  description: "shows a help message",

  execute: async (interaction: CommandInteraction) => {
    interaction.reply({ embeds: [getHelpEmbed()] });
  },
};

const COMMANDS = [
  // order matters
  help,

  // remaining commands
  get,
  go,
  inspect,
  pbs,
  ping,
  plustwo,
  remove,
  setmethod,
  view,
  viewsolve,
];

const COMMANDS_HELP_STRING = COMMANDS.map(
  (cmd) => `\`/${cmd.name}\` ${cmd.description}`
).join("\n");

/**
 * Returns a MessageEmbed containing the help strings for each command.
 * @returns {MessageEmbed} the help embed
 */
const getHelpEmbed = (): MessageEmbed => {
  return new MessageEmbed({
    color: 0x0099ff,
    title: config.BOT_NAME,
    // author: {
    //   name: `by ${pkg.author}`,
    // },
    description: pkg.description,
    // files: ['./assets/avatar.png'],
    // thumbnail: {
    //   url: 'attachment://avatar.png'
    // },
    fields: [
      {
        name: "Commands (no space required directly after `cube`)",
        value: COMMANDS_HELP_STRING,
        inline: false,
      },
    ],
    timestamp: Date.now(),
    footer: {
      text: config.FOOTER_STRING,
    },
  });
};

const bot = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

bot.once("ready", async () => {
  bot.user!.setActivity(`type '${config.prefix} help' for help`); // set bot status
  // bot.user.setAvatar('./assets/avatar.png');
  await actionsTroll.loadJokes();

  // load past solves
  const dataChannel = await bot.channels.fetch(config.DATA_CHANNEL_ID);
  await loadSolves(dataChannel as TextChannel);

  // register commands
  if (process.env.NODE_ENV == "production") {
    bot.application?.commands.set(COMMANDS);
    console.log("set commands globally");
  } else {
    bot.application?.commands.set([]);
    bot.guilds.cache.get(config.TEST_GUILD_ID)!.commands.set(COMMANDS);
    console.log("set commands in test guild");
  }

  // ready to go
  console.log(`${pkg.name}, v${pkg.version} is now up and running.`);
});

/**
 * Checks if this message stops a timer.
 * @param message the message to check
 */
const checkTimer = async (message: Message) => {
  const userId = message.author.id;
  if (timer.hasTimer(userId, message.channel.id)) {
    let time = await timer.stopTimer(message);
    let hadScramble = true;
    if (time < 0) {
      // kind of a hack
      time = -time;
      hadScramble = false;
    }
    const lines = [`Timer stopped. **${timer.formatTime(time)}**`];
    if (!hadScramble) {
      lines.push(
        "To track your solves, generate a scramble using `cube get` and " +
          "react to it. Then, your next time will be logged on your profile."
      );
    } else if (getSolver(userId).lastSolveWasPb()) {
      lines.push("That is a new personal best. Congratulations!");
    }
    const reply = lines.join("\n");
    message.reply(reply);
  }
};

bot.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const name = interaction.commandName;
  const command = COMMANDS.find((c) => c.name == name);
  if (!command) {
    return;
  }
  try {
    await command.execute(interaction);
  } catch (err) {
    console.log(err);
    await interaction.reply({
      content: "There was an error while executing this command.",
      ephemeral: true,
    });
  }
});

// when a message is sent
bot.on("messageCreate", async (message) => {
  const userId = message.author.id;
  if (userId == bot.user!.id || (message.author.bot && config.IGNORE_BOTS)) {
    // ignore message if sent by self, or sender is bot and IGNORE_BOTS is on
    return;
  }
  if (message.channel.id == config.DATA_CHANNEL_ID) {
    // not allowed to send messages here
    message.delete();
    return;
  }
  if (!(message.channel instanceof TextChannel)) {
    message.reply(
      `Due to handling reactions, ${config.BOT_NAME} can only be used ` +
        `in text channels in a server. Add ${config.BOT_NAME} to a server ` +
        `and try your command again.`
    );
    return;
  }
  await actionsTroll.handleTroll(message); // do troll responses
  await checkTimer(message);
});

// when a reaction is added to an existing message
bot.on("messageReactionAdd", async (messageReaction, user) => {
  if (!(messageReaction instanceof MessageReaction)) {
    return;
  }
  // console.log('someone reacted to: ' + messageReaction.message.content);
  const message = messageReaction.message as Message;
  if (user.id == bot.user!.id || (user.bot && config.IGNORE_BOTS)) {
    return; // ignore reacts by irrelevant users
  }
  if (message.author.id == bot.user!.id) {
    // only handle reactions to messages sent by this bot
    for (const raa of REACTION_ADD_ACTIONS) {
      if (messageReaction.emoji.name == raa.emoji && raa.appliesTo(message)) {
        raa.do(messageReaction, user as User);
      }
    }
  }
});

// when a reaction is removed from an existing message
bot.on("messageReactionRemove", async (messageReaction, user) => {
  if (!(messageReaction instanceof MessageReaction)) {
    return;
  }
  if (user.id == bot.user!.id || (user.bot && config.IGNORE_BOTS)) {
    return;
  }
  if (messageReaction.emoji.name == REACTION_ADD_ACTIONS[0].emoji) {
    REACTION_ADD_ACTIONS[1].do(messageReaction, user as User); // hack but whatever
  }
  // REACTION_REMOVE_ACTIONS.forEach(rda => {
  //   if (messageReaction.emoji.name == rda.emoji) {
  //     rda.do(messageReaction, user);
  //   }
  // });
});

// log in using environment variable
bot.login(config.AUTH_TOKEN);
