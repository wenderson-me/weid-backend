import { Router } from 'express';
import driveController from '../controllers/drive.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Não proteger a rota de callback com autenticação
router.get('/callback', (req, res, next) => driveController.handleCallback(req, res, next));

// Todas as outras rotas do Google Drive requerem autenticação
router.use(authenticate);

// Rotas de autenticação do Google Drive
router.get('/auth', (req, res, next) => driveController.initiateAuth(req, res, next));
router.get('/status', (req, res, next) => driveController.checkStatus(req, res, next));
router.post('/revoke', (req, res, next) => driveController.revokeAccess(req, res, next));

// Rotas para listar e obter detalhes de arquivos
router.get('/files', (req, res, next) => driveController.listFiles(req, res, next));
router.get('/files/:fileId', (req, res, next) => driveController.getFileDetails(req, res, next));
router.get('/files/:fileId/download', (req, res, next) => driveController.getDownloadUrl(req, res, next));

export default router;