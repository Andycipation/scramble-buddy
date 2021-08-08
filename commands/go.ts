import Command from "../interface/command";

import { formatTime } from "../bot_modules/util";
import {
  deleteInspectionTimer,
  getInspectionStartTime,
  startSolveTimer,
} from "../redis/timer";

const go: Command = {
  name: "go",
  description: "begin a solve timer, possibly after inspection",

  execute: async (interaction) => {
    const userId = interaction.user.id;
    let reply = "";
    const startTime = await getInspectionStartTime(userId);
    if (startTime) {
      await deleteInspectionTimer(userId);
      const inspectionTime = Date.now() - startTime;
      reply += `Your inspection time was ${formatTime(inspectionTime)}. `;
    }
    reply += "Your timer has started. Send anything to stop.";
    await startSolveTimer(userId, interaction.channel!.id);
    await interaction.reply(reply);
  },
};

export default go;
