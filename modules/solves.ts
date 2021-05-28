/*
Module to manage solves.

TODO: possibly implement segment tree to query min and max, then compute
averages faster using PSA and segment tree queries?
*/

import { Snowflake } from "discord.js";
import config from "../config";

import { Stack, MinStack } from "./stack";
import timer = require("./timer");

/**
 * The class representing a solve.
 */
// TODO: store only indices in the stack; this way we can report
// the index of the user's PB!
export class SolveEntry {
  public id: Snowflake;
  public userId: Snowflake;
  public time: number;
  public plusTwo: boolean;
  public scramble: string;
  public completed: Date;

  /**
   * The constructor of a SolveEntry.
   * @param id the id of the message that logged this solve
   * @param userId the id of the user who did this solve
   * @param time the number of milliseconds the solve took
   * @param plusTwo whether or not the solve got a +2
   * @param scramble the scramble of the solve
   * @param completed the time the scramble was completed
   */
  constructor(
    id: Snowflake,
    userId: Snowflake,
    time: number,
    plusTwo: boolean,
    scramble: string,
    completed: Date
  ) {
    this.id = id; // id of this solveEntry; the id of the log message
    this.userId = userId;
    this.time = time;
    this.plusTwo = plusTwo; // if plusTwo, time has already been increased by 2000
    this.scramble = scramble;
    this.completed = completed;
  }

  toString() {
    return `${timer.formatTime(this.time, this.plusTwo)} **|** ${
      this.scramble
    }`;
  }

  /**
   * Returns the string that is sent in the log to record the SolveEntry.
   */
  logString() {
    let timeString = `${this.time}`;
    if (this.plusTwo) {
      timeString += "+";
    }
    return `${this.userId}|${timeString}|${this.scramble}`;
  }

  /**
   * Toggles whether or not this solve had a +2.
   */
  togglePlusTwo() {
    if (!this.plusTwo) {
      this.time += 2000;
      this.plusTwo = true;
    } else {
      this.time -= 2000;
      this.plusTwo = false;
    }
  }
}

/**
 * The class for a user who does solves.
 */
class Solver {
  public static readonly AVGS = 3;
  public static readonly TRACKED_AVGS = [5, 12, 100];

  public userId: Snowflake;
  public method: string;
  public methodLogId: Snowflake | null;
  public solves: Stack<SolveEntry>;

  private psa: number[]; // currently unused
  public avg: MinStack<number>[];

  /**
   * The constructor for the Solver class.
   * @param userId the id of this Discord user
   */
  constructor(userId: Snowflake) {
    this.userId = userId;

    this.method = "unspecified";
    this.methodLogId = null;

    // stack<SolveEntry>
    this.solves = new Stack(
      (se1, se2) => se1.time <= se2.time, // comparison; <= to make stack work
      (se1, se2) => se1.id == se2.id // equality of two SolveEntry objects
    );
    this.psa = [0]; // prefix sum array of times

    this.avg = Array(Solver.AVGS);
    for (let i = 0; i < Solver.AVGS; ++i) {
      this.avg[i] = new MinStack();
    }
  }

  /**
   * Sets the method of this Solver.
   * @param method the method to assign to this Solver
   * @returns whether the assignment was successful
   */
  setMethod(method: string): boolean {
    if (method.includes("|")) {
      return false;
    }
    this.method = method;
    return true;
  }

  /**
   * Sets the method log id for this Solver.
   * @param methodLogId the id of the message that logged this change
   */
  setMethodLogId(methodLogId: Snowflake) {
    this.methodLogId = methodLogId;
  }

  /**
   * Returns the string that is sent in the log to record the SolveEntry.
   * @returns the log message
   */
  methodLogString(): string {
    return `${this.userId}|${this.method}`;
  }

  /**
   * Pushes a solve to this user's logs.
   * @param se the SolveEntry to add to the user's solves
   */
  pushSolve(se: SolveEntry) {
    this.psa.push(this.psa[this.solves.size()] + se.time);
    this.solves.push(se);
    for (let i = 0; i < Solver.AVGS; ++i) {
      let a = this.getAverage(Solver.TRACKED_AVGS[i]);
      if (a != -1) {
        this.avg[i].push(a);
      }
    }
  }

  /**
   * Returns the last solve of this Solver, or null if this Solver has
   * no solves completed.
   * @returns the last SolveEntry this user generated, or
   * null if no solves have been completed
   */
  getLastSolve(): SolveEntry | never {
    if (this.solves.empty()) {
      throw "tried to get the last solve of a Solver with no SolveEntry";
    }
    return this.solves.top();
  }

  /**
   * Toggles whether or not the last solve was a +2.
   * @returns whether or not the toggle was successful
   */
  togglePlusTwo(): boolean {
    if (this.solves.empty()) {
      return false; // no solve to toggle
    }
    let se = this.solves.top();
    this.solves.pop();
    for (let i = 0; i < Solver.AVGS; ++i) {
      if (!this.avg[i].empty()) {
        this.avg[i].pop();
      }
    }
    se.togglePlusTwo();
    this.pushSolve(se);
    return true;
  }

  /**
   * Pops the last SolveEntry of this Solver.
   * @returns the id of the removed solve, or null if no solves existed
   */
  popSolve(): string | never {
    if (this.solves.empty()) {
      throw "tried to pop a solve from a Solver with no SolveEntry";
    }
    const removedId = this.solves.top().id;
    this.solves.pop();
    for (let i = 0; i < Solver.AVGS; ++i) {
      if (!this.avg[i].empty()) {
        this.avg[i].pop();
      }
    }
    return removedId;
  }

  /**
   * Returns the SolveEntry denoting this Solver's personal best.
   * @returns this Solver's personal best
   */
  get pb(): SolveEntry | never {
    if (this.solves.empty()) {
      throw "tried to get PB of a Solver with no SolveEntry";
    }
    return this.solves.best;
  }

  /**
   * Returns the string showing this Solver's personal best.
   * @returns the personal best string
   */
  pbString(): string {
    if (this.solves.empty()) {
      return "N/A";
    }
    return this.pb.toString();
  }

  /**
   * Returns whether or not the last solve of this Solver was a personal best.
   * @returns whether the last solve was a personal best
   */
  lastSolveWasPb(): boolean {
    return this.getLastSolve() && this.getLastSolve().id == this.pb?.id;
  }

  /**
   * Returns the average over a given number of solves, with the fastest
   * and slowest solves ignored.
   * @param cnt the number of solves to compute the average over
   * @returns the average number of milliseconds a solve took, or -1 if cnt is less than 3
   */
  getAverage(cnt: number): number {
    let n = this.solves.size();
    if (cnt <= 2 || cnt > n) {
      return -1;
    }
    let a = [];
    for (let i = n - cnt; i < n; ++i) {
      a.push(this.solves.stk[i].time);
    }
    a.sort((x, y) => {
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    });
    let sum = 0;
    // disregard the fastest and slowest solves
    for (let i = 1; i < cnt - 1; ++i) {
      sum += a[i];
    }
    return Math.round(sum / (cnt - 2));
  }

  _getAveragesString(func: (avgStack: MinStack<number>) => number): string {
    const lines: string[] = [];
    for (let i = 0; i < Solver.AVGS; ++i) {
      if (this.avg[i].empty()) {
        continue;
      }
      const toAdd = func(this.avg[i]);
      // "Over 12: 25.366"
      lines.push(`Over ${Solver.TRACKED_AVGS[i]}: ${timer.formatTime(toAdd)}`);
    }
    if (lines.length == 0) {
      lines.push("none");
    }
    return lines.join("\n");
  }

  _getBestAveragesString(): string {
    return this._getAveragesString((avgStack: MinStack<number>) => {
      return avgStack.best;
    });
  }

  _getCurrentAveragesString(): string {
    return this._getAveragesString((avgStack: MinStack<number>) => {
      return avgStack.top();
    });
  }

  /**
   * Returns the string representing the solves in the given range,
   * in reverse order as on https://cstimer.net/.
   * @param from the starting index, inclusive
   * @param to the ending index, inclusive
   * @returns the string showing all solves in the given range
   */
  _getSolvesString(from: number, to: number): string | never {
    if (!(0 <= from && from <= to && to < this.solves.size())) {
      throw "tried to get solves in an invalid range";
    }
    const strings: string[] = [];
    for (let i = to; i >= from; i--) {
      strings.push(`${i + 1}) ${this.solves.stk[i].toString()}`);
    }
    return strings.join("\n");
  }

  /**
   * Returns the number of pages the profile would require.
   * @returns {number} the number of pages the profile would require
   */
  get numPages(): number {
    return 1 + Math.ceil(this.solves.size() / config.SOLVES_PER_PAGE);
  }

  /**
   * Returns the embed showing this Solver's profile.
   * @returns the profile embed for this Solver
   */
  getProfileEmbed() {
    return {
      color: 0x0099ff,
      title: `User Profile`,

      // show a picture of the avatar in the embed
      // files: ['./assets/avatar.png'],
      // thumbnail: {
      //   url: 'attachment://avatar.png'
      // },

      // this description mention is how page changing works;
      // thus, if changing this description format,
      // update the page-changing code in the reactions.ts module
      description: `Discord User: <@${this.userId}>`,
      fields: [
        {
          name: "Solving Method",
          value: this.method,
          inline: true,
        },
        {
          name: "Number of Solves",
          value: this.solves.size(),
          inline: true,
        },
        {
          name: "Personal Best",
          value: this.pbString(),
          // inline: false,
        },
        {
          name: "Best Averages",
          value: this._getBestAveragesString(),
          inline: true,
        },
        {
          name: "Current Averages",
          value: this._getCurrentAveragesString(),
          inline: true,
        },
      ],
      timestamp: new Date(),
      footer: {
        // NOTE: the format 'Page x/y' is required for arrows to work
        text: `${config.FOOTER_STRING} | Page 1/${this.numPages}`,
      },
    };
  }

  /**
   * Returns the embed for the given page.
   * @param page the page number to return
   * @returns the message embed for the given page
   */
  getSolvesEmbed(page: number) {
    // page - the solve page id, from 0 to ceil(# solves / config.SOLVES_PER_PAGE) - 1
    if (page < 0 || page >= this.numPages - 1) {
      // not an error
      // console.log('tried to get an embed page out of range');
      return null;
    }
    let to = this.solves.size() - 1 - page * config.SOLVES_PER_PAGE;
    let from = Math.max(to - config.SOLVES_PER_PAGE + 1, 0);
    return {
      color: 0x0099ff,
      // below: the title starting with 'Profile of' is what is used
      // in reactions.js to check if the message is a Profile message
      title: `User Profile`,

      // this description mention is how page changing works
      description: `Discord User: <@${this.userId}>`,
      fields: [
        {
          name: "Solves (most recent solve first)",
          value: this._getSolvesString(from, to),
          // inline: false,
        },
      ],
      timestamp: new Date(),
      footer: {
        // NOTE: the format 'Page x/y' is required for arrows to work
        text: `${config.FOOTER_STRING} | Page ${page + 2}/${this.numPages}`,
      },
    };
  }
}

const solvers = new Map<Snowflake, Solver>(); // map<userId, Solver>

// public functions

/**
 * Returns all current personal bests.
 * @returns {SolveEntry[]} all personal best SolveEntry objects
 */
export function getCurrentPbs(): SolveEntry[] {
  let res = [];
  for (let solver of solvers.values()) {
    if (!solver.solves.empty()) {
      // this is an important check because it is still possible to
      // have Solver objects with no SolveEntry, e.g. if someone
      // chooses to view someone's profile before they have done a solve
      res.push(solver.pb);
    }
  }
  return res;
}

/**
 * Returns the Solver for the given User object, making a new Solver
 * if one does not already exist.
 * @param userId the id of the user to retrieve a Solver for
 * @returns the Solver object of this user
 */
export function getSolver(userId: Snowflake): Solver {
  if (!solvers.has(userId)) {
    // console.log(`creating a Solver for the user with id ${userId}`);
    solvers.set(userId, new Solver(userId));
  }
  return solvers.get(userId)!;
}

/**
 * Returns the requested profile embed.
 * @param userId the user's id
 * @param page the page number to get
 * @returns the corresponding MessageEmbed
 */
export function getSolverEmbed(userId: Snowflake, page: number) {
  const solver = getSolver(userId);
  if (page == 0) {
    return solver.getProfileEmbed();
  }
  return solver.getSolvesEmbed(page - 1);
}
