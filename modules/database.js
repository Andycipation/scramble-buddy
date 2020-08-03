/*
Loads data for users, using a certain text channel as the "database".
*/

const { DATA_CHANNEL_ID, ENTRIES_LOADED } = require('../config.js');

const solves = require('./solves.js');


var channel;

function loadSolves(_channel) {
  // only called once for each time the bot starts up
  channel = _channel;
  channel.messages.fetch({ limit: ENTRIES_LOADED }).then(messages => {
    for (let message of messages.values()) {
      let data = message.content.split('|');
      let userId = data[0];
      let time = parseInt(data[1], 10);  // radix 10
      let scramble = data[2];
      solves.pushSolve(message.id, userId, time, scramble);
    }
  }).catch(console.error);
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