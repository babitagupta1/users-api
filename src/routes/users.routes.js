
import { Router } from 'express';
import { requirePermission, requireRole } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate-body.js';
import { validateIdParam } from '../middleware/validate-id.js';
import { changeRoleSchema } from '../validators/auth.schema.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schema.js';
import { presignSchema, completeUploadSchema } from '../validators/upload.schema.js';

export function createUsersRouter(container) {
  const router = Router();

  const c = container.usersController;
  const a = container.avatarController;
  const avatarUpload = container.avatarUpload;

  router.use(container.authenticate);
  router.param('id', validateIdParam);

  // Existing user routes
  router.get(
    '/',
    requireRole('admin'),
    c.list,
  );

  router.post(
    '/',
    requireRole('admin'),
    validateBody(createUserSchema),
    c.create,
  );

  router.get(
    '/:id',
    requirePermission('users:read'),
    c.getById,
  );

  router.patch(
    '/:id',
    requirePermission('users:update'),
    validateBody(updateUserSchema, { partial: true }),
    c.update,
  );

  router.patch(
    '/:id/role',
    requireRole('admin'),
    validateBody(changeRoleSchema),
    c.changeRole,
  );

  router.delete(
    '/:id',
    requirePermission('users:delete'),
    c.remove,
  );

  // Avatar routes — Assignment 2.4
  router.post(
    '/:id/avatar',
    requirePermission('users:update'),
    avatarUpload,
    a.upload,
  );

  router.delete(
    '/:id/avatar',
    requirePermission('users:update'),
    a.remove,
  );

  router.post(
    '/:id/avatar/presign',
    requirePermission('users:update'),
    validateBody(presignSchema),
    a.presign,
  );

  router.post(
    '/:id/avatar/complete',
    requirePermission('users:update'),
    validateBody(completeUploadSchema),
    a.complete,
  );

  return router;
}
