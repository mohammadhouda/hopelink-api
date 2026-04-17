process.env.JWT_SECRET_KEY         = "test-secret-key-for-jest";
process.env.NODE_ENV               = "test";
process.env.RATE_LIMIT_MAX_ATTEMPTS = "10000";
process.env.MAX_FAILED_ATTEMPTS    = "5";
process.env.LOCKOUT_DURATION_MINUTES = "15";
process.env.REFRESH_TOKEN_EXPIRY_DAYS = "7";
process.env.MAX_SESSIONS_PER_USER  = "5";
