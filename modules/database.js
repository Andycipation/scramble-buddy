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
  for (let message of logMessages) {
    let data = message.content.split('|');
    let userId = data[0];
    let time = parseInt(data[1], 10);  // radix 10
    let scramble = data[2];
    solves.pushSolve(message.id, userId, time, scramble);
  }
  console.log(`loaded ${logMessages.length} solve logs`);
}

async function logSolve(userId, time, scramble) {
  let logString = `${userId}|${time}|${scramble}`;
  // async stuff is required, or else solves.lastSolveWasPb(user.id) (line 60
  // in timer.js) will be called before the solve is pushed to the solves module
  let sent = await channel.send(logString);
  solves.pushSolve(sent.id, userId, time, scramble);
}

function removeLog(messageId) {
  // removes the message with the given id
  // returns whether the removal was successful
  channel.messages.fetch(messageId).then(message => {
    message.delete();
    return true;
  }).catch(error => {
    console.error(error);
    return false;
  });
}

exports.loadSolves = loadSolves;
exports.logSolve = logSolve;
exports.removeLog = removeLog;
