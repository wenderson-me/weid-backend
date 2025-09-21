import { Router } from 'express';
import taskController from '../controllers/task.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { USER_ROLES } from '../utils/constants';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  deleteTaskSchema,
  queryTasksSchema
} from '../validation/task.validation';

const router = Router();

router.use(authenticate);

router.get('/statistics', taskController.getTaskStatistics);

router.post('/', validate(createTaskSchema), taskController.createTask);

router.put(
  '/:id',
  validate(updateTaskSchema),
  validate(getTaskSchema, 'params'),
  taskController.updateTask
);

router.get(
  '/:id',
  validate(getTaskSchema, 'params'),
  taskController.getTaskById
);

router.delete(
  '/:id',
  validate(deleteTaskSchema, 'params'),
  taskController.deleteTask
);

router.patch(
  '/:id/archive',
  validate(getTaskSchema, 'params'),
  taskController.archiveTask
);

router.patch(
  '/:id/restore',
  validate(getTaskSchema, 'params'),
  taskController.restoreTask
);

router.post(
  '/:id/assignees/:userId',
  validate(getTaskSchema, 'params'),
  taskController.assignUser
);

router.delete(
  '/:id/assignees/:userId',
  validate(getTaskSchema, 'params'),
  taskController.unassignUser
);

router.get(
  '/',
  validate(queryTasksSchema, 'query'),
  taskController.getTasks
);

export default router;