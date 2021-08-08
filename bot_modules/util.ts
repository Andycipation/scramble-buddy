/*
A bunch of utility methods.
*/

/**
 * Converts a Date to a string.
 * @param date the date to convert to a string
 * @return the formatted date
 */
export const getDateString = (date: Date): string => {
  return date.toLocaleString("en-CA", { timeZone: "America/Toronto" });
};

/**
 * Converts a string of the form <@(id)> to id, e.g.
 * <@199904392504147968> becomes 199904392504147968.
 * @param s the mention string to convert
 * @returns the user id in the given string
 */
export const parseMention = (s: string): string => {
  return s.substring(2, s.length - 1);
};

/**
 * Returns a random integer in the range [low, high].
 * @param low the lower bound
 * @param high the upper bound
 * @returns a random number in the range [low, high]
 */
export const randInt = (low: number, high: number): number => {
  return low + Math.floor(Math.random() * (high - low + 1));
};

/**
 * Returns a formatted string for the given solve result.
 * @param milliseconds the time to format in milliseconds
 * @param plusTwo whether the solve was a +2
 * @returns the formatted time
 */
export const formatTime = (milliseconds: number, plusTwo = false): string => {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  let res = "";
  if (hours > 0) {
    res += hours + ":";
  }
  if (minutes > 0) {
    minutes %= 60;
    let minString = minutes.toString();
    if (hours > 0) {
      minString = minString.padStart(2, "0");
    }
    res += minString + ":";
  }
  seconds %= 60;
  let secString = seconds.toString();
  if (minutes > 0) {
    secString = secString.padStart(2, "0");
  }
  milliseconds %= 1000;
  res += secString + "." + milliseconds.toString().padStart(3, "0");
  if (plusTwo) {
    res += "+";
  }
  return res;
};
