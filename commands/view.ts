import Command from "../interface/command";
import config from "../config";

import { Message } from "discord.js";

import * as solves from "../bot_modules/solves";

const view: Command = {
  name: "view",
  description: "view a user's profile",
  options: [
    {
      name: "user",
      type: "USER",
      description: "user to view (default yourself)",
      required: false,
    },
    {
      name: "page",
      type: "INTEGER",
      description: "page to view",
      required: false,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.options.getUser("user", false) ?? interaction.user;
    const page = (interaction.options.getInteger("page", false) ?? 1) - 1;
    if (user.bot && config.IGNORE_BOTS) {
      await interaction.reply({
        content: "You cannot request to view a bot's solves.",
        ephemeral: true,
      });
      return;
    }
    const embed = solves.getSolverEmbed(user.id, page);
    if (!embed) {
      interaction.reply({
        content: `The page number ${page} is out of range.`,
        ephemeral: true,
      });
      return;
    }
    const sent = (await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    })) as Message;
    // collect reactions for moving left or right
    await sent.react(config.FIRST_EMOJI);
    await sent.react(config.LEFT_EMOJI);
    await sent.react(config.REFRESH_EMOJI);
    await sent.react(config.RIGHT_EMOJI);
    await sent.react(config.LAST_EMOJI);
  },
};

export default view;
