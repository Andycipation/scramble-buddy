/*
Module to manage solves.

TODO: possibly implement segment tree to query min and max, then compute
averages faster using PSA and segment tree queries?/

this is probably not a good idea lol
*/


const { FOOTER_STRING, SOLVES_PER_PAGE } = require('../config.js');
const db = require('./database.js');
const { Stack, MinStack } = require('./stack.js');
const timer = require('./timer.js');


class SolveEntry {
  constructor(id, userId, time, scramble, plusTwo) {
    this.id = id;  // id of this solveEntry; the id of the log message
    this.userId = userId;
    this.time = time;
    this.scramble = scramble;
    this.plusTwo = plusTwo;  // if plusTwo, time has already been increased by 2000
  }

  toString() {
    return `${timer.formatTime(this.time, this.plusTwo)} **|** ${this.scramble}`
  }
  
  logString() {
    let timeString = `${this.time}`;
    if (this.plusTwo) {
      timeString += '+';
    }
    return `${this.userId}|${timeString}|${this.scramble}`;
  }
  
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


class Solver {  // a user who does solves
  constructor(userId, username) {
    this.userId = userId;
    this.username = username;
    
    this.method = 'unspecified';
    
    // Stack<SolveEntry>
    this.solves = new Stack(
      (se1, se2) => (se1.time <= se2.time),  // comparison; <= to make stack work
      (se1, se2) => (se1.id == se2.id)       // equality of two SolveEntry objects
    );
    this.psa = [0];  // prefix sum array of times
    
    this.AVGS = 3;
    this.trackedAvgs = [5, 12, 100];
    this.avg = Array(this.AVGS);
    for (let i = 0; i < this.AVGS; i++) {
      this.avg[i] = new MinStack();
    }
  }

  pushSolve(se) {  // argument: the SolveEntry to add
    this.solves.push(se);
    this.psa.push(this.psa[this.solves.size()] + se.time);
    for (let i = 0; i < this.AVGS; i++) {
      let a = this.getAverage(this.trackedAvgs[i]);
      if (a != -1) {
        this.avg[i].push(a);
      }
    }
  }
  
  get lastSolve() {
    if (this.solves.empty()) {
      return null;
    }
    return this.solves.top();
  }
  
  togglePlusTwoOnLastSolve() {
    if (this.solves.empty()) {
      return false;  // no solve to toggle
    }
    let se = this.solves.top();
    this.solves.pop();
    for (let i = 0; i < this.AVGS; i++) {
      if (!this.avg[i].empty()) {
        this.avg[i].pop();
      }
    }
    se.togglePlusTwo();
    this.pushSolve(se);
    return true;
  }

  popSolve() {
    // returns whether the pop was successful
    if (this.solves.empty()) {
      return false;
    }
    db.removeLog(this.solves.top().id);
    this.solves.pop();
    for (let i = 0; i < this.AVGS; i++) {
      if (!this.avg[i].empty()) {
        this.avg[i].pop();
      }
    }
    return true;
  }

  get pb() {
    if (this.solves.empty()) {
      return null;
    }
    return this.solves.best;
  }

  pbString() {
    let pb = this.pb;
    if (pb === null) {
      return 'N/A';
    }
    return pb.toString();
  }

  lastSolveWasPb() {
    return (this.lastSolve !== null && this.lastSolve.id == this.pb.id);
  }

  getAverage(cnt) {  // average over last cnt solves
    let n = this.solves.size();
    if (cnt <= 2 || cnt > n) {
      return -1;
    }
    let a = [];
    for (let i = n - cnt; i < n; i++) {
      a.push(this.solves.stk[i].time);
    }
    a.sort((x, y) => {
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    });
    let s = 0;
    // disregard the fastest and slowest solves
    for (let i = 1; i < cnt - 1; i++) {
      s += a[i];
    }
    return Math.round(s / (cnt - 2));
  }
  
  _getBestAverages() {
    let lines = [];
    for (let i = 0; i < this.AVGS; i++) {
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
  
  _getCurrentAverages() {
    let lines = [];
    for (let i = 0; i < this.AVGS; i++) {
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
  //   for (let i = 0; i < cnt; i++) {
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
   * @param {int} from the starting index, inclusive
   * @param {int} to the ending index, inclusive
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
   */
  get numPages() {
    return 1 + Math.ceil(this.solves.size() / SOLVES_PER_PAGE);
  }

  getProfileEmbed() {
    return {
      color: 0x0099ff,
      title: `Profile of ${this.username}`,
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
          value: this._getBestAverages(),
          inline: true,
        },
        {
          name: 'Current Averages',
          value: this._getCurrentAverages(),
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
      title: `Profile of ${this.username}`,

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

// function _ensureUser(userId) {
//   if (!solvers.has(userId)) {
//     console.error(`${userId} does not have a Solver object`);
//     return false;
//   }
//   return true;
// }


// public functions

function initUser(userId, username) {
  if (solvers.has(userId)) {
    return false;
  }
  solvers.set(userId, new Solver(userId, username));
  return true;
}

function getCurrentPbs() {  // returns Array<SolveEntry>
  let res = [];
  for (let solver of solvers.values()) {
    let pb = solver.pb;
    if (pb !== null) {
      res.push(pb);
    }
  }
  return res;
}

function getLastSolve(userId) {
  return solvers.get(userId).lastSolve;
}

function pushSolve(id, userId, time, scramble, plusTwo) {
  solvers.get(userId).pushSolve(new SolveEntry(id, userId, time, scramble, plusTwo));
}

function popSolve(userId) {
  return solvers.get(userId).popSolve();
}

function getUserEmbed(userId, page) {
  const solver = solvers.get(userId);
  if (page == 0) {
    return solver.getProfileEmbed();
  }
  return solver.getSolvesEmbed(page - 1);
}

function lastSolveWasPb(userId) {
  return solvers.get(userId).lastSolveWasPb();
}

function setMethod(userId, method) {
  solvers.get(userId).method = method;
}

function togglePlusTwo(userId) {
  return solvers.get(userId).togglePlusTwoOnLastSolve();
}


exports.initUser = initUser;
exports.getCurrentPbs = getCurrentPbs;
exports.getLastSolve = getLastSolve;
exports.pushSolve = pushSolve;
exports.popSolve = popSolve;
exports.getUserEmbed = getUserEmbed;
exports.lastSolveWasPb = lastSolveWasPb;
exports.setMethod = setMethod;
exports.togglePlusTwo = togglePlusTwo;
