/*
Everything initialization-related.
*/


const solves = require('./solves.js');

function initUser(user) {
  solves.initUser(user.id, user.username);
}

function initGuild(guild) {
  for (const guildMember of guild.members.cache.values()) {
    if (guildMember.user.bot) {
      continue;
    }
    initUser(guildMember.user);
  }
}


exports.initGuild = initGuild;
exports.initUser = initUser;
