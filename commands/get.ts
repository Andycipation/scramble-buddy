import fs from "fs";

import Command from "../interface/command";
import config from "../config";

import { getScramble } from "../bot_modules/scramble";
import * as timer from "../bot_modules/timer";
import { Message, MessageOptions } from "discord.js";

const get: Command = {
  name: "get",
  description: "generate a new scramble",

  execute: async (interaction) => {
    const filename = `./assets/${interaction.id}.png`;
    const scramble = await getScramble(filename);
    // add the sender automatically
    const userId = interaction.user.id;
    timer.setScramble(userId, scramble);
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
    setTimeout(async () => {
      const sent = (await interaction.reply({
        ...options,
        fetchReply: true,
      })) as Message;
      await sent.react(config.CONFIRM_EMOJI);
      await sent.react(config.REMOVE_EMOJI);
      if (config.MAKE_SCRAMBLE_IMAGES) {
        fs.unlinkSync(filename);
      }
    }, 100);
  },
};

export default get;
