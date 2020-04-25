/*
Module to manage solves.
*/

const { formatTime } = require('./timer.js');
const { FOOTER_STRING } = require('../settings.js');

var numSolves = 0;

class SolveEntry {
  constructor(userId, time, scramble) {
    this.id = numSolves++;
    this.userId = userId;
    this.time = time;
    this.scramble = scramble;
  }

  get string() {
    return `<@${this.userId}>: ${formatTime(this.time)}\n- scramble: ${this.scramble}`
  }
}

class Solver { // a user who does solves
  constructor(userId) {
    this.userId = userId;
    this.solves = []; // array of SolveEntry objects
    this.pbs = [];
  }

  pushSolve(se) { // argument: the SolveEntry to add
    this.solves.push(se);
    if (this.pb === null || se.time < this.pb.time) {
      this.pbs.push(se);
    }
  }

  popSolve() {
    if (this.solves.length == 0) {
      return false;
    }
    if (this.lastSolveWasPb) {
      this.pbs.pop();
    }
    this.solves.pop();
    return true;
  }

  get lastSolve() {
    if (this.solves.length == 0) {
      return null;
    }
    return this.solves[this.solves.length - 1];
  }

  get pb() {
    if (this.pbs.length == 0) {
      return null;
    }
    return this.pbs[this.pbs.length - 1];
  }

  get pbString() {
    let pb = this.pb;
    if (pb === null) {
      return 'N/A';
    }
    return pb.string;
  }

  lastSolveWasPb() {
    return (this.lastSolve !== null && this.lastSolve.id == this.pb.id);
  }

  getAverage(cnt) { // average over last cnt solves
    let n = this.solves.length;
    if (cnt <= 0 || cnt > n) {
      return -1;
    }
    let s = 0;
    for (let i = n - cnt; i < n; i++) {
      s += this.solves[i].time;
    }
    return Math.round(s / cnt);
  }

  _getAverageString(cnt) {
    let avg = this.getAverage(cnt);
    // console.log('avg: ' + avg);
    if (avg == -1) {
      return 'N/A';
    }
    return formatTime(avg);
  }

  get embed() {
    return {
      color: 0x0099ff,
      title: `Profile of <@${this.userId}>`,
      // files: ['./assets/avatar.png'],
      // thumbnail: {
      //   url: 'attachment://avatar.png'
      // },
      fields: [
        {
          name: 'Statistics',
          value: `Personal best: ${this.pbString}\n`
            + `Average over 5: ${this._getAverageString(5)}\n`
            + `Average over 12: ${this._getAverageString(12)}`
        }
      ],
      timestamp: new Date(),
      footer: {
        text: FOOTER_STRING
      }
    };
  }
}

const solvers = new Map(); // map<userId, Solver>

// private functions for map initialization

function _addSolverUserId(userId) {
  if (solvers.has(userId)) {
    return false;
  }
  solvers.set(userId, new Solver(userId));
  return true;
}

function _initUserId(userId) {
  _addSolverUserId(userId);
}


// public functions

function getCurrentPbs() { // returns Array<SolveEntry>
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
  _initUserId(userId);
  return solvers.get(userId).lastSolve;
}

function pushSolve(userId, time, scramble) { // returns whether or not a new PB was achieved
  _initUserId(userId);
  solvers.get(userId).pushSolve(new SolveEntry(userId, time, scramble));
}

function popSolve(userId) {
  _initUserId(userId);
  return solvers.get(userId).popSolve();
}

function getUserEmbed(userId) {
  _initUserId(userId);
  return solvers.get(userId).embed;
}

function lastSolveWasPb(userId) {
  _initUserId(userId);
  return solvers.get(userId).lastSolveWasPb();
}

exports.getCurrentPbs = getCurrentPbs;
exports.getLastSolve = getLastSolve;
exports.pushSolve = pushSolve;
exports.popSolve = popSolve;
exports.getUserEmbed = getUserEmbed;
exports.lastSolveWasPb = lastSolveWasPb;
