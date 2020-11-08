/*
Module to manage solves.

TODO: possibly implement segment tree to query min and max, then compute
averages faster using PSA and segment tree queries?
*/


const Discord = require('discord.js');

const { FOOTER_STRING, SOLVES_PER_PAGE } = require('../config.js');
const { Stack, MinStack } = require('./stack.js');
const timer = require('./timer.js');


/**
 * The class representing a solve.
 */
class SolveEntry {
  /**
   * The constructor of a SolveEntry.
   * @param {string} id the id of the message that logged this solve
   * @param {string} userId the id of the user who did this solve
   * @param {number} time the number of milliseconds the solve took
   * @param {boolean} plusTwo whether or not the solve got a +2
   * @param {string} scramble the scramble of the solve
   */
  constructor(id, userId, time, plusTwo, scramble) {
    this.id = id;  // id of this solveEntry; the id of the log message
    this.userId = userId;
    this.time = time;
    this.plusTwo = plusTwo;  // if plusTwo, time has already been increased by 2000
    this.scramble = scramble;
  }

  toString() {
    return `${timer.formatTime(this.time, this.plusTwo)} **|** ${this.scramble}`
  }

  /**
   * Returns the string that is sent in the log to record the SolveEntry.
   */
  logString() {
    let timeString = `${this.time}`;
    if (this.plusTwo) {
      timeString += '+';
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
  /**
   * The constructor for the Solver class.
   * @param {string} userId the id of this Discord user
   */
  constructor(userId) {
    this.userId = userId;

    this.method = 'unspecified';
    this.methodLogId = null;

    // stack<SolveEntry>
    this.solves = new Stack(
      (se1, se2) => (se1.time <= se2.time),  // comparison; <= to make stack work
      (se1, se2) => (se1.id == se2.id)       // equality of two SolveEntry objects
    );
    this.psa = [0];  // prefix sum array of times

    this.AVGS = 3;
    this.trackedAvgs = [5, 12, 100];
    this.avg = Array(this.AVGS);
    for (let i = 0; i < this.AVGS; ++i) {
      this.avg[i] = new MinStack();
    }
  }

  /**
   * Sets the method of this Solver.
   * @param {string} method the method to assign to this Solver
   * @returns {boolean} whether the assignment was successful
   */
  setMethod(method) {
    if (method.includes('|')) {
      return false;
    }
    this.method = method;
    return true;
  }

  /**
   * Sets the method log id for this Solver.
   * @param {string} methodLogId the id of the message that logged this change
   */
  setMethodLogId(methodLogId) {
    this.methodLogId = methodLogId;
  }

  /**
   * Returns the string that is sent in the log to record the SolveEntry.
   * @returns {string} the log message
   */
  methodLogString() {
    return `${this.userId}|${this.method}`;
  }

  /**
   * Pushes a solve to this user's logs.
   * @param {SolveEntry} se the SolveEntry to add to the user's solves
   */
  pushSolve(se) {
    this.psa.push(this.psa[this.solves.size()] + se.time);
    this.solves.push(se);
    for (let i = 0; i < this.AVGS; ++i) {
      let a = this.getAverage(this.trackedAvgs[i]);
      if (a != -1) {
        this.avg[i].push(a);
      }
    }
  }

  /**
   * Returns the last solve of this Solver, or null if this Solver has
   * no solves completed.
   * @returns {SolveEntry} the last SolveEntry this user generated, or
   * null if no solves have been completed
   */
  getLastSolve() {
    if (this.solves.empty()) {
      return null;
    }
    return this.solves.top();
  }

  /**
   * Toggles whether or not the last solve was a +2.
   * @returns {boolean} whether or not the toggle was successful
   */
  togglePlusTwo() {
    if (this.solves.empty()) {
      return false;  // no solve to toggle
    }
    let se = this.solves.top();
    this.solves.pop();
    for (let i = 0; i < this.AVGS; ++i) {
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
   * @returns {string} the id of the removed solve, or null if no solves existed
   */
  popSolve() {
    if (this.solves.empty()) {
      return null;
    }
    const removedId = this.solves.top().id;
    this.solves.pop();
    for (let i = 0; i < this.AVGS; ++i) {
      if (!this.avg[i].empty()) {
        this.avg[i].pop();
      }
    }
    return removedId;
  }

  /**
   * Returns the SolveEntry denoting this Solver's personal best.
   * @returns {SolveEntry} this Solver's personal best
   */
  get pb() {
    if (this.solves.empty()) {
      return null;
    }
    return this.solves.best;
  }

  /**
   * Returns the string showing this Solver's personal best.
   * @returns the personal best string
   */
  pbString() {
    let pb = this.pb;
    if (pb === null) {
      return 'N/A';
    }
    return pb.toString();
  }

  /**
   * Returns whether or not the last solve of this Solver was a personal best.
   * @returns whether the last solve was a personal best
   */
  lastSolveWasPb() {
    return (this.getLastSolve() !== null && this.getLastSolve().id == this.pb.id);
  }

  /**
   * Returns the average over a given number of solves, with the fastest
   * and slowest solves ignored.
   * @param {number} cnt the number of solves to compute the average over
   * @returns {number} the average number of milliseconds a solve took,
   * or -1 if cnt is less than 3
   */
  getAverage(cnt) {
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
    let s = 0;
    // disregard the fastest and slowest solves
    for (let i = 1; i < cnt - 1; ++i) {
      s += a[i];
    }
    return Math.round(s / (cnt - 2));
  }

  _getBestAveragesString() {
    let lines = [];
    for (let i = 0; i < this.AVGS; ++i) {
      if (this.avg[i].empty()) {
        continue;
      }
      lines.push(`Over ${this.trackedAvgs[i]}: `
        + `${timer.formatTime(this.avg[i].best, false)}`);
    }
    if (lines.length == 0) {
      lines.push('none');
    }
    return lines.join('\n');
  }

  _getCurrentAveragesString() {
    let lines = [];
    for (let i = 0; i < this.AVGS; ++i) {
      if (this.avg[i].empty()) {
        continue;
      }
      lines.push(`Over ${this.trackedAvgs[i]}: `
        + `${timer.formatTime(this.avg[i].top(), false)}`);
    }
    if (lines.length == 0) {
      lines.push('none');
    }
    return lines.join('\n');
  }

  // _getLastSolvesString(cnt) {  // most recent solve last
  //   cnt = Math.min(cnt, this.solves.size());
  //   let entries = [];
  //   for (let i = 0; i < cnt; ++i) {
  //     let se = this.solves.stk[this.solves.size() - cnt + i];
  //     entries.push(`${se.toString()}`);
  //   }
  //   if (entries.length == 0) {
  //     entries.push('none');
  //   }
  //   return entries.join('\n');
  // }

  /**
   * Returns the string representing the solves in the given range,
   * in reverse order as on https://cstimer.net/.
   * @param {number} from the starting index, inclusive
   * @param {number} to the ending index, inclusive
   * @returns {string} the string showing all solves in the given range
   */
  _getSolvesString(from, to) {
    if (from < 0 || from > to || to >= this.solves.size()) {
      console.error('tried to get solves in an invalid range');
      return null;
    }
    let res = '';
    for (let i = to; i >= from; i--) {
      if (i != to) {
        res += '\n';
      }
      res += `${i + 1}) ${this.solves.stk[i].toString()}`;
    }
    return res;
  }

  /**
   * Returns the number of pages the profile would require.
   * @returns {number} the number of pages the profile would require
   */
  get numPages() {
    return 1 + Math.ceil(this.solves.size() / SOLVES_PER_PAGE);
  }

  /**
   * Returns the embed showing this Solver's profile.
   * @returns {Discord.MessageEmbed} the profile embed for this Solver
   */
  getProfileEmbed() {
    return {
      color: 0x0099ff,
      title: `User Profile`,
      // files: ['./assets/avatar.png'],
      // thumbnail: {
      //   url: 'attachment://avatar.png'
      // },

      // this description mention is how page changing works
      description: `Discord User: <@${this.userId}>`,
      fields: [
        {
          name: 'Solving Method',
          value: this.method,
          inline: true,
        },
        {
          name: 'Number of Solves',
          value: this.solves.size(),
          inline: true,
        },
        {
          name: 'Personal Best',
          value: this.pbString(),
        },
        {
          name: 'Best Averages',
          value: this._getBestAveragesString(),
          inline: true,
        },
        {
          name: 'Current Averages',
          value: this._getCurrentAveragesString(),
          inline: true,
        },
      ],
      timestamp: new Date(),
      footer: {
        // NOTE: the format 'Page x/y' is required for arrows to work
        text: `${FOOTER_STRING} | Page 1/${this.numPages}`
      },
    };
  }

  /**
   * Returns the embed for the given page.
   * @param {number} page the page number to return
   * @returns {Discord.MessageEmbed} the message embed for the given page
   */
  getSolvesEmbed(page) {
    // page - the solve page id, from 0 to ceil(# solves / SOLVES_PER_PAGE) - 1
    if (page < 0 || page >= this.numPages - 1) {
      // not an error
      // console.log('tried to get an embed page out of range');
      return null;
    }
    let to = this.solves.size() - 1 - page * SOLVES_PER_PAGE;
    let from = Math.max(to - SOLVES_PER_PAGE + 1, 0);
    return {
      color: 0x0099ff,
      // below: the title starting with 'Profile of' is what is used
      // in reactions.js to check if the message is a Profile message
      title: `User Profile`,

      // this description mention is how page changing works
      description: `Discord User: <@${this.userId}>`,
      fields: [
        {
          name: 'Solves (most recent solve first)',
          value: this._getSolvesString(from, to),
        },
      ],
      timestamp: new Date(),
      footer: {
        // NOTE: the format 'Page x/y' is required for arrows to work
        text: `${FOOTER_STRING} | Page ${page + 2}/${this.numPages}`
      },
    };
  }
}


const solvers = new Map();  // map<userId, Solver>


// public functions

/**
 * Returns all current personal bests.
 * @returns {SolveEntry[]} all personal best SolveEntry objects
 */
function getCurrentPbs() {
  let res = [];
  for (let solver of solvers.values()) {
    let pb = solver.pb;
    if (pb !== null) {
      // this is an important check because it is still possible to
      // have Solver objects with no SolveEntry, e.g. if someone
      // chooses to view someone's profile before they have done a solve
      res.push(pb);
    }
  }
  return res;
}

/**
 * Returns the Solver for the given User object, making a new Solver
 * if one does not already exist.
 * @param {string} userId the id of the user to retrieve a Solver for
 * @returns {Solver} the Solver object of this user
 */
function getSolver(userId) {
  if (!solvers.has(userId)) {
    console.log(`creating a Solver for the user with id ${userId}`);
    solvers.set(userId, new Solver(userId));
  }
  return solvers.get(userId);
}

/**
 * Returns the requested profile embed.
 * @param {string} userId the user's id
 * @param {number} page the page number to get
 * @returns {Discord.MessageEmbed} the corresponding MessageEmbed
 */
function getSolverEmbed(userId, page) {
  const solver = getSolver(userId);
  if (page == 0) {
    return solver.getProfileEmbed();
  }
  return solver.getSolvesEmbed(page - 1);
}


exports.getCurrentPbs = getCurrentPbs;
exports.getSolver = getSolver;
exports.getSolverEmbed = getSolverEmbed;
exports.SolveEntry = SolveEntry;
