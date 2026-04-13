/**
 * Middleware that parses `page` and `limit` query params into integers,
 * clamps them to safe bounds, and attaches them to `req.pagination`.
 *
 * Defaults: page=1, limit=10. Max limit=100 to prevent unbounded queries.
 *
 * Usage:
 *   router.get("/items", parsePagination(), listItems);
 *   router.get("/feed",  parsePagination({ defaultLimit: 20 }), getFeed);
 *
 *   // In controller:
 *   const { skip, take, page, limit } = req.pagination;
 */
export function parsePagination({ defaultLimit = 10, maxLimit = 100 } = {}) {
  return function (req, _res, next) {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));

    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    };

    next();
  };
}
