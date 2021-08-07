import Command from "../interface/command";

import { getSolver } from "../bot_modules/solves";
import { popSolve } from "../bot_modules/database";

const remove: Command = {
  name: "remove",
  description: "remove your last scramble",

  execute: async (interaction) => {
    const userId = interaction.user.id;
    const solver = getSolver(userId);
    if (!solver.solves.empty()) {
      const lastSolve = solver.getLastSolve();
      const worked = await popSolve(userId);
      if (worked) {
        interaction.reply({
          content:
            `${interaction.user.username}, your last solve has been removed.\n` +
            "The removed solve is shown below:\n" +
            lastSolve.toString(),
        });
      } else {
        console.error("couldn't pop solve");
      }
    } else {
      interaction.reply(
        `${interaction.user.username}, you have not done any solves.`
      );
    }
  },
};

export default remove;
