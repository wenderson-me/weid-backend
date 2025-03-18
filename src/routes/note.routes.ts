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

// Todas as rotas de notas requerem autenticação
router.use(authenticate);

// Rota para obter estatísticas das notas
router.get('/statistics', noteController.getNoteStatistics);

// CRUD Básico
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

// Ações adicionais
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

// Listagem de notas com filtros
router.get(
  '/',
  validate(queryNotesSchema, 'query'),
  noteController.getNotes
);

export default router;