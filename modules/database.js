/*
Loads data for users, using a certain text channel as the "database".
*/


const { DATA_CHANNEL_ID } = require('../config.js');

const solves = require('./solves.js');


var channel;

async function loadSolves(_channel) {
  // only called once for each time the bot starts up
  console.log('loading solve logs');
  channel = _channel;
  let lastId = null;
  let logMessages = [];
  while (true) {
    let messages = await channel.messages.fetch({ limit: 100, before: lastId });
    if (messages.size == 0) {
      break;
    }
    for (let message of messages.values()) {
      logMessages.push(message);
      lastId = message.id;
    }
  }
  logMessages.reverse();  // push the entries in the correct order
  let solveLogs = 0;
  let methodLogs = 0;
  for (const message of logMessages) {
    let data = message.content.split('|');
    const userId = data[0];
    const solver = solves.getSolver(userId);
    if (data.length == 3) {  // solve log
      let time = parseInt(data[1], 10);  // radix 10; it is okay for data[1] to end with '+'
      let plusTwo = data[1].endsWith('+');
      let scramble = data[2];
      const se = new solves.SolveEntry(message.id, userId, time, plusTwo, scramble);
      solver.pushSolve(se);
      ++solveLogs;
    } else if (data.length == 2) {  // method-setting log
      let method = data[1];
      solver.setMethod(method);
      solver.setMethodLogId(message.id);
      ++methodLogs;
    }
  }
  console.log(`loaded ${solveLogs} solve logs and ${methodLogs} method logs`);
}

/**
 * Logs the solve in the data channel, where +2 is false by default.
 * @param {string} userId the user id to log the solve under
 * @param {Number} time the number of milliseconds the solve took
 * @param {string} scramble the scramble used
 */
async function logSolve(userId, time, scramble) {
  const solver = solves.getSolver(userId);
  const se = new solves.SolveEntry(null, userId, time, scramble, false);
  // async stuff is required, or else solves.lastSolveWasPb(user.id) (line 60
  // in timer.js) will be called before the solve is pushed to the solves module
  const id = await sendLog(se.logString());
  se.id = id;
  solver.pushSolve(se);
}

/**
 * Sets the solving method for a specified user.
 * @param {string} userId the user id to modify
 * @param {string} method the new method of this Solver
 * @returns {Promise<boolean>} whether the assignment succeeded
 */
async function setMethod(userId, method) {
  const solver = solves.getSolver(userId);
  if (!solver.setMethod(method)) {
    return false;  // invalid method provided
  }
  if (solver.methodLogId !== null) {
    deleteLog(solver.methodLogId);
  }
  const id = await sendLog(solver.methodLogString());
  solver.setMethodLogId(id);
  return true;
}

/**
 * Sends the given string to the log channel and returns the message id.
 * @param {string} logString the string to log in the channel
 * @returns {Promise<string>} the id of the message that was sent
 */
async function sendLog(logString) {
  const sent = await channel.send(logString);
  return sent.id;
}

/**
 * Removes the message with the given id from the log channel.
 * @param {string} messageId the id of the message to remove
 * @returns {Promise<boolean>} whether the deletion was successful
 */
async function deleteLog(messageId) {
  const message = await channel.messages.fetch(messageId);
  if (!message.deletable) {
    console.error(`why is this message in the bot log not deletable? id: ${message.id}`);
    return false;
  }
  message.delete();
  return true;
}

/**
 * Toggles whether the last solve of a user was a +2.
 * @param {string} userId the id of the user to toggle +2
 * @returns {Promise<boolean>} whether the toggle was successful
 */
async function togglePlusTwo(userId) {
  const solver = solves.getSolver(userId);
  if (!solver.togglePlusTwo()) {
    return false;
  }
  const se = solver.getLastSolve();
  const message = await channel.messages.fetch(se.id);
  if (!message.editable) {
    // this should never happen lol
    console.error(`why is this message in the bot log not editable? id: ${message.id}`);
    return false;
  }
  message.edit(se.logString());
  return true;
}

/**
 * Removes the last solve for the given user.
 * @param {string} userId the user id to pop a solve from
 * @returns {Promise<boolean>} whether the removal succeeded
 */
async function popSolve(userId) {
  const solver = solves.getSolver(userId);
  const id = solver.popSolve();
  if (id === null) {
    return false;
  }
  return deleteLog(id);
}


exports.loadSolves = loadSolves;
exports.logSolve = logSolve;
exports.setMethod = setMethod;
exports.deleteLog = deleteLog;
exports.togglePlusTwo = togglePlusTwo;
exports.popSolve = popSolve;
