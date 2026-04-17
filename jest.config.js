export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["./tests/env.setup.js"],
  setupFilesAfterEnv: ["./tests/setup.js"],
  moduleNameMapper: {
    ".*/src/config/bullBoard\\.js$":     "<rootDir>/tests/__mocks__/bullBoard.js",
    ".*/src/config/redis\\.js$":         "<rootDir>/tests/__mocks__/redis.js",
    ".*/src/jobs/matchScoreQueue\\.js$": "<rootDir>/tests/__mocks__/matchScoreQueue.js",
  },
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
  coverageDirectory: "coverage",
  testTimeout: 30000,
  forceExit: false,
  detectOpenHandles: false,
};
