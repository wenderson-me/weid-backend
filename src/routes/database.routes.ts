import { Router } from 'express';
import databaseController from '../controllers/database.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { USER_ROLES } from '../utils/constants';

const router = Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN));

router.get('/stats', databaseController.getStats);

export default router;
