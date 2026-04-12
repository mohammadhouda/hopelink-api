const url = new URL(process.env.REDIS_URL);

export const redisOptions = {
  host:             url.hostname,
  port:             Number(url.port) || 6379,
  password:         url.password || undefined,
  username:         url.username || undefined,
  tls:              url.protocol === "rediss:" ? {} : undefined,
  maxRetriesPerRequest: null,   // required by BullMQ
  enableReadyCheck:     false,
};

console.log(`[Redis] config → ${url.protocol}//${url.hostname}:${url.port}`);
