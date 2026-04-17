// Prevents BullMQ + Redis connections during tests.
export const serverAdapter = {
  getRouter: () => (req, res, next) => next(),
  setBasePath: () => {},
};
