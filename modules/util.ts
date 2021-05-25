/*
A bunch of utility methods.
*/

import config from "../config";

/**
 * Converts a Date to a string.
 * @param date the date to convert to a string
 * @return the formatted date
 */
export function getDateString(date: Date): string {
  return date.toLocaleString("en-CA", { timeZone: "America/Toronto" });
}

/**
 * Returns the arguments of the given command.
 * @param s the command to parse
 * @returns the arguments, split by space
 */
export function parseCommand(s: string): string[] {
  s = s.trim();
  if (s.startsWith(config.prefix)) {
    s = s.substring(config.prefix.length).trim();
  }
  return s.split(" ");
}

/**
 * Converts a string of the form <@(id)> to id, e.g.
 * <@199904392504147968> becomes 199904392504147968.
 * @param s the mention string to convert
 * @returns the user id in the given string
 */
export function parseMention(s: string): string {
  return s.substring(2, s.length - 1);
}

/**
 * Returns a random integer in the range [low, high].
 * @param low the lower bound
 * @param high the upper bound
 * @returns a random number in the range [low, high]
 */
export function randInt(low: number, high: number): number {
  return low + Math.floor(Math.random() * (high - low + 1));
}
