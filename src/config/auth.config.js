const authConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 20
  },

  // Account lockout
  lockout: {
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS) || 5,
    durationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15,
    attemptWindowMinutes: parseInt(process.env.ATTEMPT_WINDOW_MINUTES) || 15
  },

  // Tokens
  tokens: {
    accessTokenExpiry: "20m",
    refreshTokenExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS) || 7
  },

  // Sessions
  sessions: {
    maxPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER) || 5
  },

  // Password
  password: {
    minLength: parseInt(process.env.MIN_PASSWORD_LENGTH) || 8,
    bcryptRounds: 12
  }
};

export default authConfig;