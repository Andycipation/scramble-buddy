import { Snowflake } from "discord-api-types";
import { scrambleRedis } from "./clients";

export const setScramble = async (
  userId: Snowflake,
  scrambleString: string
): Promise<void> => {
  await scrambleRedis.set(userId, scrambleString);
};

export const deleteScramble = async (userId: Snowflake): Promise<boolean> => {
  const count = await scrambleRedis.del(userId);
  return count == 1;
};
