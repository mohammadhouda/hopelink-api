import { failure } from "../utils/response.js";

export default function restrictTo(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return failure(res, 'Forbidden: You do not have access to this resource', 403);
        }
        next();
    };
}