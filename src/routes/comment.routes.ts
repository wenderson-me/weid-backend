import { Router } from 'express';
import commentController from '../controllers/comment.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCommentSchema,
  updateCommentSchema,
  getCommentSchema,
  deleteCommentSchema,
  queryCommentsSchema,
  toggleCommentLikeSchema
} from '../validation/comment.validation';

const router = Router();

// Todas as rotas de comentários requerem autenticação
router.use(authenticate);

// CRUD Básico
router.post('/', validate(createCommentSchema), commentController.createComment);

router.put(
  '/:id',
  validate(updateCommentSchema),
  validate(getCommentSchema, 'params'),
  commentController.updateComment
);

router.get(
  '/:id',
  validate(getCommentSchema, 'params'),
  commentController.getCommentById
);

router.delete(
  '/:id',
  validate(deleteCommentSchema, 'params'),
  commentController.deleteComment
);

// Ações adicionais
router.post(
  '/:id/like',
  validate(toggleCommentLikeSchema, 'params'),
  commentController.toggleLike
);

router.get(
  '/:id/replies',
  validate(getCommentSchema, 'params'),
  commentController.getCommentReplies
);

// Listagem de comentários com filtros
router.get(
  '/',
  validate(queryCommentsSchema, 'query'),
  commentController.getComments
);

export default router;