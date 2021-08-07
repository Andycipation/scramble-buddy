newCommand(
  "solvemode",
  "enters solve mode (no prefix required to call commands)",
  (message) => {
    inSolveMode.add(message.author.id);
    // TODO: change these to reply?
    message.channel.send(
      `${message.author.username}, you no longer need ` +
        `the prefix \`${config.prefix}\` to call ${config.BOT_NAME} commands.`
    );
  }
);
newCommand("exitsolvemode", "exits solve mode", (message) => {
  inSolveMode.delete(message.author.id);
  message.channel.send(
    `${message.author.username}, you now need ` +
      `the prefix \`${config.prefix}\` to call ${config.BOT_NAME} commands.`
  );
});
