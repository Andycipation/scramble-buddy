import Command from "../interface/command";
import config from "../config";

import { MessageEmbed, TextChannel } from "discord.js";
import { getCurrentPbs } from "../bot_modules/solves";

/**
 * Returns a MessageEmbed containing the leaderboard, ranked by personal
 * bests. This function must be above the newCommand declaration for
 * the 'cube pbs' command.
 * @returns the leaderboard embed
 */
const getPbEmbed = (textChannel: TextChannel): MessageEmbed => {
  // only include users in this channel
  const pbs = getCurrentPbs().filter((se) =>
    textChannel.members.has(se.userId)
  );

  // sort first by time, then in chronological order
  pbs.sort((e1, e2) => {
    if (e1.time < e2.time) return -1;
    if (e1.time > e2.time) return 1;
    if (e1.completed.getTime() < e2.completed.getTime()) return -1;
    if (e1.completed.getTime() > e2.completed.getTime()) return 1;
    return 0;
  });

  // trim list if too long
  pbs.length = Math.min(pbs.length, config.LEADERBOARD_LENGTH);

  // get mentions
  const strings = [];
  for (let i = 0; i < pbs.length; ++i) {
    strings.push(`${i + 1}) ${`<@${pbs[i].userId}>: ${pbs[i]}`}`);
  }
  if (strings.length == 0) {
    strings.push("No one has a personal best yet. Be the first to have one!");
  }
  const pbStr = strings.join("\n");

  return new MessageEmbed({
    color: 0x0099ff,
    title: "Personal Bests",
    // files: ['./assets/avatar.png'],
    // thumbnail: {
    //   url: 'attachment://avatar.png'
    // },
    fields: [
      {
        name: "Leaderboard",
        value: pbStr,
        inline: false,
      },
    ],
    timestamp: Date.now(),
    footer: {
      text: config.FOOTER_STRING,
    },
  });
};

const pbs: Command = {
  name: "pbs",
  description: "view personal bests",

  execute: async (interaction) => {
    const { channel } = interaction;
    if (channel instanceof TextChannel) {
      interaction.reply({ embeds: [getPbEmbed(channel)] });
    } else {
      interaction.reply({
        content: "You are not in an appropriate channel for this command.",
        ephemeral: true,
      });
    }
  },
};

export default pbs;
