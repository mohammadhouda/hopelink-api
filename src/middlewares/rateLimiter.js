import rateLimit from "express-rate-limit";
import authConfig from "../config/auth.config.js";


export const rateLimiter = rateLimit({
    windowMs: authConfig.rateLimiter.windowMs * 60 * 1000, // convert minutes to milliseconds
    max: authConfig.rateLimiter.maxRequests, // limit each IP to maxRequests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    skipSuccessfulRequests: true
});

export default rateLimiter;
