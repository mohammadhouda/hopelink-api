import cron from "node-cron";
import { cleanupExpiredTokens } from "../utils/cleanupTokens.js";

// every day at 3 AM
cron.schedule("0 3 * * *", async () => {
  try {
    console.log(" Running refresh token cleanup...");
    await cleanupExpiredTokens();
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
});
