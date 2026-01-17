import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    skipSuccessfulRequests: true
});

export default rateLimiter;
