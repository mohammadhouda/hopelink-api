import prismaMock from "../__mocks__/prisma.js";

// Re-export the mock so tests can set up return values and assert calls
// without importing the mock path directly.
//
// Usage in a test:
//   import { prismaMock } from "../helpers/db.helper.js";
//   prismaMock.user.findMany.mockResolvedValue([...]);
export { prismaMock };
