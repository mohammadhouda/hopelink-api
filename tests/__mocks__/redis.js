// Prevents Redis connections during tests.
// This mock is used instead of src/config/redis.js

export const redisOptions = {
  host: "localhost",
  port: 6379,
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 0,
};

export default redisOptions;
