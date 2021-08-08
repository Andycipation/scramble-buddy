import Command from "../interface/command";

import { hasInspectionTimer, startInspectionTimer } from "../redis/timer";

const NOTIFICATIONS = [8, 12]; // notify when 8 and 12 seconds have passed
const WARNINGS = [15, 17]; // warn at 15 and 17 seconds (> 17 seconds is a DNF)

const inspect: Command = {
  name: "inspect",
  description: "begin an inspection timer",

  execute: async (interaction) => {
    const { user } = interaction;
    if (await hasInspectionTimer(user.id)) {
      interaction.reply({
        content: "Error: you currently have an inspecting timer running.",
        ephemeral: true,
      });
      return;
    }

    await startInspectionTimer(user.id);
    interaction.reply("Your inspection timer has begun. You have 15 seconds.");

    // prepare warning replies
    for (const s of NOTIFICATIONS) {
      setTimeout(async () => {
        // Map#get returns undefined if the key is not present
        if (await hasInspectionTimer(user.id)) {
          interaction.followUp({
            content: `${user.username}, ${s} seconds have gone by.`,
            ephemeral: true,
          });
        }
      }, s * 1000); // times 1000 because in milliseconds
    }

    // notify if the user is "getting penalized" (according to WCA regulations:
    // https://www.worldcubeassociation.org/regulations/)
    for (const s of WARNINGS) {
      setTimeout(async () => {
        if (await hasInspectionTimer(user.id)) {
          interaction.followUp({
            content: `${user.username}, you have used ${s} seconds of inspection!`,
            ephemeral: true,
          });
        }
      }, s * 1000);
    }
  },
};

export default inspect;
