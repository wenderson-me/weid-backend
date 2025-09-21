import { Router } from 'express';
import noteController from '../controllers/note.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createNoteSchema,
  updateNoteSchema,
  getNoteSchema,
  deleteNoteSchema,
  queryNotesSchema
} from '../validation/note.validation';

const router = Router();

router.use(authenticate);

router.get('/statistics', noteController.getNoteStatistics);

router.post('/', validate(createNoteSchema), noteController.createNote);

router.put(
  '/:id',
  validate(updateNoteSchema),
  validate(getNoteSchema, 'params'),
  noteController.updateNote
);

router.get(
  '/:id',
  validate(getNoteSchema, 'params'),
  noteController.getNoteById
);

router.delete(
  '/:id',
  validate(deleteNoteSchema, 'params'),
  noteController.deleteNote
);

router.patch(
  '/:id/pin',
  validate(getNoteSchema, 'params'),
  noteController.pinNote
);

router.patch(
  '/:id/unpin',
  validate(getNoteSchema, 'params'),
  noteController.unpinNote
);

router.get(
  '/',
  validate(queryNotesSchema, 'query'),
  noteController.getNotes
);

export default router;