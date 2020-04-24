/*
Module to manage solves.
*/

const { formatTime } = require('./timer.js');

class SolveEntry {
  constructor(userId, time, scramble) {
    this.userId = userId;
    this.time = time;
    this.scramble = scramble;
  }

  get string() {
    return `<@${this.userId}>: ${formatTime(this.time)}\n- scramble: ${this.scramble}`
  }
}

var pbs = new Map(); // map from user id to SolveEntry representing their pbs
// TODO: later, add stacks for personal bests?

function updatePb(userId, time, scramble) {
  if (pbs.has(userId) && pbs.get(userId).time <= time) {
    return false;
  }
  pbs.set(userId, new SolveEntry(userId, time, scramble));
  return true;
}

function getPb(userId) {
  if (!pbs.has(userId)) {
    return -1;
  }
  return pbs.get(userId);
}

function getPbs() {
  return pbs;
}

function deletePb(userId) {
  return pbs.delete(userId);
}

function clearAllPbs() {
  pbs.clear();
}

exports.updatePb = updatePb;
exports.deletePb = deletePb;
exports.clearAllPbs = clearAllPbs;
exports.getPbs = getPbs;
exports.getPb = getPb;
