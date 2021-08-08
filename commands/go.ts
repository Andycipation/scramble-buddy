import Command from "../interface/command";

import inspecting from "../bot_modules/inspectionTimers";
import { startTimer } from "../bot_modules/timer";
import { formatTime } from "../bot_modules/util";

const go: Command = {
  name: "go",
  description: "begin a solve timer, possibly after inspection",

  execute: async (interaction) => {
    const userId = interaction.user.id;
    let reply = "";
    const startTime = inspecting.get(userId);
    if (startTime) {
      inspecting.delete(userId);
      const inspectionTime = Date.now() - startTime;
      reply += `Your inspection time was ${formatTime(inspectionTime)}. `;
    }
    reply += "Your timer has started. Send anything to stop.";
    startTimer(userId, interaction.channel!.id);
    interaction.reply(reply);
  },
};

export default go;
