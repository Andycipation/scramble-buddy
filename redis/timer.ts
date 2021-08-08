/*

*/

import { Snowflake } from "discord-api-types";
import { timerRedis } from "./clients";

/**
 * Starts a timer for a user in a channel.
 * @param userId the id of the user to start a timer for
 * @param channelId the channel the timer is bound to
 */
export const startTimer = async (
  userId: Snowflake,
  channelId: Snowflake
): Promise<void> => {
  await timerRedis.hset(userId, channelId, Date.now());
};

/**
 * Returns whether there is a timer for a user in a channel.
 * @param userId the id of the user to check
 * @param channelId the id of the channel to check
 * @returns whether there is a timer with the given parameters
 */
export const getStartTime = async (
  userId: Snowflake,
  channelId: Snowflake
): Promise<number | null> => {
  const res = await timerRedis.hget(userId, channelId);
  return res != null ? +res : null;
};
