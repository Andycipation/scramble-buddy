/*
Loads data for users, using a certain text channel as the "database".
*/

import { Collection, Message, Snowflake, TextChannel } from "discord.js";
import config from "../config";

import * as solves from "./solves";

// TODO: find a cleaner way
let channel: TextChannel;

export async function loadSolves(_channel: TextChannel): Promise<void> {
  // only called once for each time the bot starts up
  console.log("loading solve logs");
  channel = _channel;
  let lastId = undefined;
  const logMessages: Message[] = [];
  while (logMessages.length < config.LOGS_TO_LOAD) {
    const messages: Collection<string, Message> = await channel.messages.fetch({
      limit: Math.min(config.LOGS_TO_LOAD - logMessages.length, 100),
      before: lastId,
    });
    if (messages.size == 0) {
      break;
    }
    for (const message of messages.values()) {
      logMessages.push(message);
      lastId = message.id;
    }
  }
  logMessages.reverse(); // push the entries in the correct order
  let solveLogs = 0;
  let methodLogs = 0;
  for (const message of logMessages) {
    const data = message.content.split("|");
    const userId = data[0];
    const solver = solves.getSolver(userId);
    if (data.length == 3) {
      // solve log
      const time = parseInt(data[1], 10); // radix 10; it is okay for data[1] to end with '+'
      const plusTwo = data[1].endsWith("+");
      const scramble = data[2];
      const se = new solves.SolveEntry(
        message.id,
        userId,
        time,
        plusTwo,
        scramble,
        message.createdAt
      );
      solver.pushSolve(se);
      ++solveLogs;
    } else if (data.length == 2) {
      // method-setting log
      const method = data[1];
      solver.setMethod(method);
      solver.setMethodLogId(message.id);
      ++methodLogs;
    }
  }
  console.log(`loaded ${solveLogs} solve logs and ${methodLogs} method logs`);
}

/**
 * Logs the solve in the data channel, where +2 is false by default.
 * @param userId the user id to log the solve under
 * @param time the number of milliseconds the solve took
 * @param scramble the scramble used
 */
export async function logSolve(
  userId: Snowflake,
  time: number,
  scramble: string
): Promise<void> {
  const solver = solves.getSolver(userId);
  // kind of a hack
  const se = new solves.SolveEntry(
    "",
    userId,
    time,
    false,
    scramble,
    new Date(Date.now())
  );
  const id = await _sendLog(se.logString());
  se.id = id;
  solver.pushSolve(se);
}

/**
 * Sets the solving method for a specified user.
 * @param userId the user id to modify
 * @param method the new method of this Solver
 * @returns whether the assignment succeeded
 */
export async function setMethod(
  userId: Snowflake,
  method: string
): Promise<boolean> {
  const solver = solves.getSolver(userId);
  if (!solver.setMethod(method)) {
    return false; // invalid method provided
  }
  if (solver.methodLogId !== null) {
    deleteLog(solver.methodLogId);
  }
  const id = await _sendLog(solver.methodLogString());
  solver.setMethodLogId(id);
  return true;
}

/**
 * Sends the given string to the log channel and returns the message id.
 * @param logString the string to log in the channel
 * @returns the id of the message that was sent
 */
async function _sendLog(logString: string): Promise<Snowflake> {
  const sent = await channel.send(logString);
  return sent.id;
}

/**
 * Removes the message with the given id from the log channel.
 * @param messageId the id of the message to remove
 * @returns whether the deletion was successful
 */
export async function deleteLog(messageId: Snowflake): Promise<boolean> {
  const message = await channel.messages.fetch(messageId);
  if (!message.deletable) {
    console.error(
      `why is this message in the bot log not deletable? id: ${message.id}`
    );
    return false;
  }
  message.delete();
  return true;
}

/**
 * Toggles whether the last solve of a user was a +2.
 * @param userId the id of the user to toggle +2
 * @returns whether the toggle was successful
 */
export async function togglePlusTwo(userId: Snowflake): Promise<boolean> {
  const solver = solves.getSolver(userId);
  if (!solver.togglePlusTwo()) {
    return false;
  }
  const se = solver.getLastSolve();
  const message = await channel.messages.fetch(se.id);
  if (!message.editable) {
    // this should never happen lol
    console.error(
      `why is this message in the bot log not editable? id: ${message.id}`
    );
    return false;
  }
  message.edit(se.logString());
  return true;
}

/**
 * Removes the last solve for the given user.
 * @param userId the user id to pop a solve from
 * @returns whether the removal succeeded
 */
export async function popSolve(userId: Snowflake): Promise<boolean> {
  const solver = solves.getSolver(userId);
  const id = solver.popSolve();
  if (id === null) {
    return false;
  }
  return deleteLog(id);
}
