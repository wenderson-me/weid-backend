import { Router } from 'express';
import activityController from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId/history', activityController.getTaskHistory);

router.get('/note/:noteId/history', activityController.getNoteHistory);

router.get('/user/recent', activityController.getUserActivities);

router.get('/user/related', activityController.getUserRelatedActivities);

router.get(
  '/user/:userId/recent',

  activityController.getSpecificUserActivities
);

router.get(
  '/',
  activityController.getActivities
);

router.get('/:id', activityController.getActivityById);

router.post(
  '/',
  activityController.createActivity
);

export default router;