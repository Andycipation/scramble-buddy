import fs from "fs";

import Command from "../interface/command";
import config from "../config";

import { MessageOptions } from "discord.js";

import * as solves from "../bot_modules/solves";
import { getDateString } from "../bot_modules/util";
import { makeImage } from "../bot_modules/genScramble";

const viewsolve: Command = {
  name: "viewsolve",
  description: "view details of a solve",
  options: [
    {
      name: "user",
      type: "USER",
      description: "user to view (default yourself)",
      required: false,
    },
    {
      name: "solve",
      type: "INTEGER",
      description: "the number of the solve to view (default most recent)",
      required: false,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.options.getUser("user", false) ?? interaction.user;
    if (user.bot && config.IGNORE_BOTS) {
      await interaction.reply({
        content: "You cannot request to view a bot's solves.",
        ephemeral: true,
      });
      return;
    }

    const solver = solves.getSolver(user.id);
    const count = solver.solves.size();
    if (count == 0) {
      interaction.reply(
        `${user.username} does not yet have an existing solve.`
      );
      return;
    }
    const solve = (interaction.options.getInteger("solve", false) ?? count) - 1;
    if (solve < 0 || solve >= count) {
      interaction.reply({
        content: `Invalid solve number provided: ${solve + 1}`,
        ephemeral: true,
      });
      return;
    }
    const se = solver.solves.at(solve);
    const messageContent =
      `**Details for solve ${solve + 1} of ${user.username}**\n` +
      `${se.toString()}\n` +
      `Time the solve was completed: ${getDateString(se.completed)}`;

    const filename = `./assets/${interaction.id}.png`;
    await makeImage(se.scramble, filename);
    const options: MessageOptions = {
      content: messageContent,
    };
    if (config.MAKE_SCRAMBLE_IMAGES) {
      options.files = [filename];
    }

    await interaction.reply(options);
    if (config.MAKE_SCRAMBLE_IMAGES) {
      // TODO: try to avoid blocking?
      fs.unlinkSync(filename);
    }
  },
};

export default viewsolve;
