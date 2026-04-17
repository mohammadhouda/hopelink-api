import { jest } from "@jest/globals";

// Mock Queue event emitter methods to prevent BullMQ warnings
export const matchScoreQueue = {
  add: jest.fn().mockResolvedValue({}),
  on: jest.fn().mockReturnThis(),
  off: jest.fn(),
  once: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  removeAllListeners: jest.fn(),
  close: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  isReady: jest.fn().mockResolvedValue(),
};
