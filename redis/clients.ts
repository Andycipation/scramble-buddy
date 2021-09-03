import Redis from "ioredis";
import { exit } from "process";

const getRedis = (keyPrefix: string) => {
  const redis = new Redis(process.env.REDIS_URL, {
    keyPrefix, // prepend to all keys
    showFriendlyErrorStack: true,
  });

  redis.on("error", (err) => {
    console.error("Redis server failed to connect:", err);
    exit(1);
  });

  redis.on("connect", () => {
    console.log(`redis with prefix "${keyPrefix}" is connected`);
  });

  redis.flushall();

  return redis;
};

export const inspectRedis = getRedis("i:");
export const scrambleRedis = getRedis("s:");
export const timerRedis = getRedis("t:");
