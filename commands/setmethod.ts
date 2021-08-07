import Command from "../interface/command";

import { setMethod } from "../bot_modules/database";

const METHOD_CHOICES = ["CFOP", "Roux", "ZZ", "off-meta"];

// set the method used by user
const setmethod: Command = {
  name: "setmethod",
  description: "set your solving method",
  options: [
    {
      name: "method",
      description: "the solving method to set",
      type: "STRING",
      choices: METHOD_CHOICES.map((s) => {
        return { name: s, value: s };
      }),
      required: true,
    },
  ],

  execute: async (interaction) => {
    const { user } = interaction;
    const method = interaction.options.getString("method", true);
    if (await setMethod(user.id, method)) {
      interaction.reply(`Set solving method to **${method}**.`);
    } else {
      console.error(method);
    }
  },
};

export default setmethod;
