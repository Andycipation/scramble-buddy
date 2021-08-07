import { ApplicationCommandData, CommandInteraction } from "discord.js";

interface Command extends ApplicationCommandData {
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export default Command;
