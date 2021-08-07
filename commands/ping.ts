import Command from "../interface/command";

const ping: Command = {
  name: "ping",
  description: 'replies with "Pong!"',

  execute: async (interaction) => {
    await interaction.reply({ content: "Pong!" });
  },
};

export default ping;
