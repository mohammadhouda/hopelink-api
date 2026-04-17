import { beforeEach, afterAll } from "@jest/globals";
import { mockReset } from "jest-mock-extended";
import prismaMock from "./__mocks__/prisma.js";

// Suppress BullMQ Redis eviction policy warnings (these are expected in test env)
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0];
  if (typeof msg === "string" && (
    msg.includes("Eviction policy") ||
    msg.includes("IMPORTANT!") ||
    msg.includes("optimistic-volatile")
  )) {
    return;
  }
  originalWarn(...args);
};

// Suppress "Cannot log after tests are done" errors for known async operations
const originalError = console.error;
console.error = (...args) => {
  const msg = args[0];
  if (typeof msg === "string" && (
    msg.includes("Failed to send registration approval email") ||
    msg.includes("Failed to send registration decline email") ||
    msg.includes("Failed to send verification approval email") ||
    msg.includes("Failed to send verification decline email")
  )) {
    return;
  }
  originalError(...args);
};

// Reset all mocked methods before every test to prevent cross-test pollution.
beforeEach(() => {
  mockReset(prismaMock);
});

// Allow Jest to exit gracefully by giving async operations time to complete
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
