/*
Map<Snowflake, Map<Snowflake, number>>();
*/

import { Snowflake } from "discord-api-types";
import { inspectRedis, timerRedis } from "./clients";

export const hasInspectionTimer = async (
  userId: Snowflake
): Promise<boolean> => {
  const count = await inspectRedis.exists(userId);
  return count == 1;
};

export const startInspectionTimer = async (
  userId: Snowflake
): Promise<boolean> => {
  if (await hasInspectionTimer(userId)) {
    return false;
  }
  await inspectRedis.set(userId, Date.now());
  return true;
};

export const getInspectionStartTime = async (
  userId: Snowflake
): Promise<number | null> => {
  const res = await inspectRedis.get(userId);
  return res != null ? +res : null;
};

export const deleteInspectionTimer = async (
  userId: Snowflake
): Promise<boolean> => {
  const count = await inspectRedis.del(userId);
  return count == 1;
};

/**
 * Starts a timer for a user in a channel.
 * @param userId the id of the user to start a timer for
 * @param channelId the channel the timer is bound to
 */
export const startSolveTimer = async (
  userId: Snowflake,
  channelId: Snowflake
): Promise<void> => {
  await inspectRedis.del(userId);
  await timerRedis.hset(userId, channelId, Date.now());
};

/**
 * Returns whether there is a timer for a user in a channel.
 * @param userId the id of the user to check
 * @param channelId the id of the channel to check
 * @returns whether there is a timer with the given parameters
 */
export const getSolveStartTime = async (
  userId: Snowflake,
  channelId: Snowflake
): Promise<number | null> => {
  const res = await timerRedis.hget(userId, channelId);
  return res != null ? +res : null;
};
