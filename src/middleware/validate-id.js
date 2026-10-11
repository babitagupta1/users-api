import { badRequest } from '../utils/http-error.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateIdParam(req, res, next, id) {
  if (!UUID_PATTERN.test(id)) {
    return next(badRequest('id must be a valid UUID'));
  }

  next();
}