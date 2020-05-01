/*
Everything initialization-related.
*/

const db = require('./database.js');
const solves = require('./solves.js');

function loadDatabase() {

}

function initUser(user) {
  console.log('initializing a user with username: ' + user.username);
  solves.initUser(user.id, user.username);
}

function initGuild(guild) {
  for (let guildMember of guild.members.cache.values()) {
    if (guildMember.user.bot) {
      continue;
    }
    initUser(guildMember.user);
  }
}


exports.loadDatabase = loadDatabase;
exports.initGuild = initGuild;
exports.initUser = initUser;
