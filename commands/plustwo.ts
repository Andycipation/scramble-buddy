import Command from "../interface/command";

import * as db from "../bot_modules/database";
import { getSolver } from "../bot_modules/solves";

const plustwo: Command = {
  name: "plustwo",
  description: "toggle whether the last solve was a +2",

  execute: async (interaction) => {
    const userId = interaction.user.id;
    const solver = getSolver(userId);
    if (db.togglePlusTwo(userId)) {
      const se = solver.getLastSolve();
      interaction.reply(
        `+2 was ${se.plusTwo ? "added to" : "removed from"} your ` +
          `last solve.\nThe modified solve entry is shown below:\n${se.toString()}`
      );
    } else {
      interaction.reply("You do not have an existing solve.");
    }
  },
};

export default plustwo;
