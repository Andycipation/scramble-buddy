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
    const replyLines = [];
    const inspectionStart = await getInspectionStartTime(userId);
    if (inspectionStart) {
      await deleteInspectionTimer(userId);
      const inspectionTime = Date.now() - inspectionStart;
      replyLines.push(
        `Your inspection time was ${formatTime(inspectionTime)}.`
      );
    }
    replyLines.push("Your timer has started. Send anything to stop.");
    await startSolveTimer(userId, interaction.channel!.id);
    await interaction.reply({
      content: replyLines.join("\n"),
    });
  },
};

export default go;
