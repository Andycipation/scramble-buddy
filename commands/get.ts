import fs from "fs";

import Command from "../interface/command";
import config from "../config";

import { genScramble } from "../bot_modules/genScramble";
import { Message, MessageOptions } from "discord.js";
import { setScramble } from "../redis/scramble";

const get: Command = {
  name: "get",
  description: "generate a new scramble",

  execute: async (interaction) => {
    const filename = `./assets/${interaction.id}.png`;
    const scramble = await genScramble(filename);
    // add the sender automatically
    const userId = interaction.user.id;
    setScramble(userId, scramble);

    // send message
    const messageContent =
      `${scramble}\n` +
      `${config.SCRAMBLE_REACT_PROMPT}\n` +
      `Contenders:\n` +
      `<@${userId}>`;
    const options: MessageOptions = {
      content: messageContent,
    };
    if (config.MAKE_SCRAMBLE_IMAGES) {
      options.files = [filename];
    }

    // send scramble
    const sent = (await interaction.reply({
      ...options,
      fetchReply: true,
    })) as Message;

    // reaction collectors
    await sent.react(config.CONFIRM_EMOJI);
    await sent.react(config.REMOVE_EMOJI);

    // clean up
    if (config.MAKE_SCRAMBLE_IMAGES) {
      fs.unlinkSync(filename);
    }
  },
};

export default get;
