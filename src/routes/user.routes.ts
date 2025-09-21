import { Router } from 'express';
import userController from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { USER_ROLES } from '../utils/constants';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
  queryUsersSchema,
  updatePreferencesSchema,
  avatarUploadSchema
} from '../validation/user.validation';

const router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

router.put(
  '/profile/preferences',
  authenticate,
  validate(updatePreferencesSchema),
  userController.updatePreferences
);

router.put(
  '/profile/avatar',
  authenticate,
  validate(avatarUploadSchema),
  userController.updateAvatar
);

router.patch(
  '/profile/deactivate',
  authenticate,
  userController.deactivateOwnAccount
);

router.get(
  '/profile/statistics',
  authenticate,
  userController.getProfileStatistics
);

router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validate(createUserSchema),
  userController.createUser
);

router.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validate(updateUserSchema),
  validate(getUserSchema, 'params'),
  userController.updateUser
);

router.get(
  '/:id',
  authenticate,
  validate(getUserSchema, 'params'),
  userController.getUserById
);

router.delete(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(deleteUserSchema, 'params'),
  userController.deleteUser
);

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validate(getUserSchema, 'params'),
  userController.deactivateUser
);

router.patch(
  '/:id/activate',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validate(getUserSchema, 'params'),
  userController.activateUser
);

router.get(
  '/',
  authenticate,
  validate(queryUsersSchema, 'query'),
  userController.getUsers
);

export default router;