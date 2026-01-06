import { failure } from "../utils/response.js";

export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return failure(res, error.details.map(d => d.message).join(', '), 400);
    }
    req[property] = value;
    next();
  };
}
