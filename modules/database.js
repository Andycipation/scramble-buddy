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
  logMessages.reverse();  // push the entries in order
  let solveLogs = 0;
  let methodLogs = 0;
  for (let message of logMessages) {
    let data = message.content.split('|');
    if (data.length == 3) {  // solve log
      let userId = data[0];
      let time = parseInt(data[1], 10);  // radix 10; it is okay for data[1] to end with '+'
      let scramble = data[2];
      let plusTwo = data[1].endsWith('+');
      solves.pushSolve(message.id, userId, time, scramble, plusTwo);
      solveLogs++;
    } else if (data.length == 2) {  // method-setting log
      let userId = data[0];
      let method = data[1];
      solves.setMethod(userId, method);
      methodLogs++;
    }
  }
  console.log(`loaded ${solveLogs} solve logs and ${methodLogs} method logs`);
}

async function logSolve(userId, time, scramble) {
  // logs the solve where plusTwo is false by default
  let logString = `${userId}|${time}|${scramble}`;
  // async stuff is required, or else solves.lastSolveWasPb(user.id) (line 60
  // in timer.js) will be called before the solve is pushed to the solves module
  let sent = await channel.send(logString);
  solves.pushSolve(sent.id, userId, time, scramble, false);
}

function setMethod(userId, method) {
  if (method.includes('|')) {
    return false;
  }
  let logString = `${userId}|${method}`;
  channel.send(logString);
  solves.setMethod(userId, method);
  return true;
}

function removeLog(messageId) {
  // removes the message with the given id
  // returns whether the removal was successful
  channel.messages.fetch(messageId).then(message => {
    if (!message.deletable) {
      console.error(`why is this message in the bot log not deletable? id: ${message.id}`);
      return;
    }
    message.delete();
  }).catch(console.error);
}

function togglePlusTwo(userId) {
  // toggles whether the last solve of the given user was a +2
  // returns whether or not the toggle was successful
  if (solves.togglePlusTwo(userId)) {
    let se = solves.getLastSolve(userId);
    channel.messages.fetch(se.id).then(message => {
      if (!message.editable) {  // this should never happen lol
        console.error(`why is this message in the bot log not editable? id: ${message.id}`);
        return;
      }
      message.edit(se.logString());
    }).catch(console.error);
    return true;
  }
  return false;
}


exports.loadSolves = loadSolves;
exports.logSolve = logSolve;
exports.setMethod = setMethod;
exports.removeLog = removeLog;
exports.togglePlusTwo = togglePlusTwo;
