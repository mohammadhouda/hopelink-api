import { Queue } from "bullmq";
import { redisOptions } from "../config/redis.js";

export const matchScoreQueue = new Queue("match-scores", {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

matchScoreQueue.on("error", (err) =>
  console.error("[MatchScoreQueue] error:", err.message)
);
