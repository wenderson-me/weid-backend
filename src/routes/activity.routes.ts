import { Router } from 'express';
import activityController from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de atividades requerem autenticação
router.use(authenticate);

// Histórico de uma tarefa específica
router.get('/task/:taskId/history', activityController.getTaskHistory);

// Histórico de uma nota específica
router.get('/note/:noteId/history', activityController.getNoteHistory);

// Atividades recentes do usuário logado
router.get('/user/recent', activityController.getUserActivities);

// Atividades relacionadas ao usuário (como ator ou alvo)
router.get('/user/related', activityController.getUserRelatedActivities);

// Atividades recentes de um usuário específico (acesso restrito)
router.get(
  '/user/:userId/recent',

  activityController.getSpecificUserActivities
);

// Listar atividades com filtros (acesso restrito)
router.get(
  '/',
  activityController.getActivities
);

// Obter uma atividade específica por ID
router.get('/:id', activityController.getActivityById);

// Registrar uma atividade manualmente (acesso restrito, pouco usado diretamente)
router.post(
  '/',
  activityController.createActivity
);

export default router;