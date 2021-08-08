/*
Module to manage all actions related to timing.

TODO: rework using Redis?
*/

import { Message } from "discord.js";
import { deleteScramble, getScramble } from "../redis/scramble";
import { getSolveStartTime } from "../redis/timer";

import { logSolve } from "./database";
import { getSolver } from "./solves";
import { formatTime } from "./util";

/**
 * Checks if this message stops a timer.
 * @param message the message to check
 */
export const checkTimer = async (message: Message): Promise<boolean> => {
  const userId = message.author.id;
  const channelId = message.channel.id;

  // check if a timer existed
  const startTime = await getSolveStartTime(userId, channelId);
  if (startTime == null) {
    return false;
  }

  let time = Date.now() - startTime;
  const lines = [`Timer stopped. **${formatTime(time)}**`];

  // check if a scramble was selected
  const scramble = await getScramble(userId);
  if (scramble != null) {
    await logSolve(userId, time, scramble);
    deleteScramble(userId);
    if (getSolver(userId).lastSolveWasPb()) {
      lines.push("That is a new personal best. Congratulations!");
    }
  } else {
    time = -time;
    lines.push(
      "To track your solves, generate a scramble using `cube get` and " +
        "react to it. Then, your next time will be logged on your profile."
    );
  }

  const reply = lines.join("\n");
  message.reply(reply);
  return true;
};
