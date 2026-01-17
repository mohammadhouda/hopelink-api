import rateLimit from "express-rate-limit";
import authConfig from "../config/auth.config.js";


export const rateLimiter = rateLimit({
    windowMs: authConfig.rateLimit.windowMs, // convert minutes to milliseconds
    max: authConfig.rateLimit.maxAttempts, // limit each IP to maxRequests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    skipSuccessfulRequests: true
});

export default rateLimiter;
