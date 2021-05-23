/*
Module to manage all actions related to timing.
*/

import Discord = require('discord.js');
import db = require('./database.js');

/**
 * Returns a formatted string for the given solve result.
 * @param milliseconds the time to format in milliseconds
 * @param plusTwo whether the solve was a +2
 * @returns the formatted time
 */
export function formatTime(milliseconds: number, plusTwo: boolean): string {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let res = '';
  if (hours > 0) {
    res += hours + ":";
  }
  if (minutes > 0) {
    minutes %= 60;
    let minString = minutes.toString();
    if (hours > 0) {
      minString = minString.padStart(2, '0');
    }
    res += minString + ':';
  }
  seconds %= 60;
  let secString = seconds.toString();
  if (minutes > 0) {
    secString = secString.padStart(2, '0');
  }
  milliseconds %= 1000;
  res += secString + '.' + milliseconds.toString().padStart(3, '0');
  if (plusTwo) {
    res += '+';
  }
  return res;
}

// map<userId, map<channelId, startTime>>
const startTimes = new Map<Discord.Snowflake, Map<Discord.Snowflake, number>>();

// map from user id to scramble string
const curScramble = new Map<Discord.Snowflake, string>();

/**
 * Starts a timer for a user in a channel.
 * @param userId the id of the user to start a timer for
 * @param channelId the channel the timer is bound to
 */
export function startTimer(userId: Discord.Snowflake, channelId: Discord.Snowflake) {
  if (!startTimes.has(userId)) {
    startTimes.set(userId, new Map());
  }
  startTimes.get(userId)!.set(channelId, Date.now());
}

/**
 * Returns whether there is a timer for a user in a channel.
 * @param userId the id of the user to check
 * @param channelId the id of the channel to check
 * @returns whether there is a timer with the given parameters
 */
export function hasTimer(userId: Discord.Snowflake, channelId: Discord.Snowflake): boolean {
  return (startTimes.has(userId) && startTimes.get(userId)!.has(channelId));
}

/**
 * Stops the timer and returns the solve time of the user. If a scramble was
 * selected, logs the solve in the database.
 * @param user the user to check
 * @param channel the channel to check
 * @returns the solve time, or its negative if no scramble was selected
 */
export async function _stopTimer(user: Discord.User, channel: Discord.Channel): Promise<number> | null {
  if (!hasTimer(user.id, channel.id)) {
    return null;
  }
  const time = Date.now() - startTimes.get(user.id).get(channel.id);
  startTimes.get(user.id).delete(channel.id);
  if (!curScramble.has(user.id)) {
    return -time;  // nothing to log or delete
  }
  await db.logSolve(user.id, time, curScramble.get(user.id));
  curScramble.delete(user.id);
  return time;
}

/**
 * Stops the timer and returns the solve time of the user. If a scramble was
 * selected, logs the solve in the database.
 * @param message the message to check
 * @returns the solve time, or its negative if no scramble was selected
 */
export async function stopTimer(message: Discord.Message): Promise<number> | null {
  return _stopTimer(message.author, message.channel);
}

export function setScramble(userId: Discord.Snowflake, scrambleString: string): void {
  curScramble.set(userId, scrambleString);
}

export function deleteScramble(userId: Discord.Snowflake) {
  return curScramble.delete(userId);
}
