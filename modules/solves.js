/*
Module to manage solves.

TODO: make a stack data structure to query minimum and pop from stack?
*/


const { FOOTER_STRING } = require('../config.js');
const db = require('./database.js');
const { Stack, MinStack } = require('./stack.js');
const timer = require('./timer.js');


class SolveEntry {
  constructor(id, userId, time, scramble) {
    this.id = id;  // id of this solveEntry; the id of the log message
    this.userId = userId;
    this.time = time;
    this.scramble = scramble;
  }

  toString() {
    return `${timer.formatTime(this.time)} **|** ${this.scramble}`
  }
}


class Solver {  // a user who does solves
  constructor(userId, username) {
    this.userId = userId;
    this.username = username;
    
    this.method = 'unspecified';
    
    // Stack<SolveEntry>
    this.solves = new Stack(
      (se1, se2) => (se1.time < se2.time),
      (se1, se2) => (se1.id == se2.id)
    )
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

  // _getAverageString(cnt) {
  //   let avg = this.getAverage(cnt);
  //   if (avg == -1) {
  //     return 'N/A';
  //   }
  //   return timer.formatTime(avg);
  // }
  
  _getBestAverages() {
    let lines = [];
    for (let i = 0; i < this.AVGS; i++) {
      if (this.avg[i].empty()) {
        continue;
      }
      lines.push(`Over ${this.trackedAvgs[i]}: `
        + `${timer.formatTime(this.avg[i].best)}`);
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
        + `${timer.formatTime(this.avg[i].top())}`);
    }
    if (lines.length == 0) {
      lines.push('none');
    }
    return lines.join('\n');
  }
  
  _getLastSolvesString(cnt) {  // most recent solve last
    cnt = Math.min(cnt, this.solves.size());
    let entries = [];
    for (let i = 0; i < cnt; i++) {
      let se = this.solves.stk[this.solves.size() - cnt + i];
      entries.push(`${se.toString()}`);
    }
    if (entries.length == 0) {
      entries.push('none');
    }
    return entries.join('\n');
  }

  get embed() {
    return {
      color: 0x0099ff,
      title: `Profile of ${this.username}`,
      // files: ['./assets/avatar.png'],
      // thumbnail: {
      //   url: 'attachment://avatar.png'
      // },
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
        {
          name: 'Latest Solves (most recent solve last)',
          value: this._getLastSolvesString(5)  // show the last 10 solves
        },
      ],
      timestamp: new Date(),
      footer: {
        text: FOOTER_STRING
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

function pushSolve(id, userId, time, scramble) {
  solvers.get(userId).pushSolve(new SolveEntry(id, userId, time, scramble));
}

function popSolve(userId) {
  return solvers.get(userId).popSolve();
}

function getUserEmbed(userId) {
  return solvers.get(userId).embed;
}

function lastSolveWasPb(userId) {
  return solvers.get(userId).lastSolveWasPb();
}

function setMethod(userId, method) {
  solvers.get(userId).method = method;
}

exports.initUser = initUser;
exports.getCurrentPbs = getCurrentPbs;
exports.getLastSolve = getLastSolve;
exports.pushSolve = pushSolve;
exports.popSolve = popSolve;
exports.getUserEmbed = getUserEmbed;
exports.lastSolveWasPb = lastSolveWasPb;
exports.setMethod = setMethod;
