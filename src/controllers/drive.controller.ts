import { Request, Response, NextFunction } from 'express';
import driveService from '../services/drive.service';
import {
  successResponse,
  unauthorizedResponse
} from '../utils/responseHandler';
import { MESSAGES } from '../utils/constants';
import jwt from 'jsonwebtoken';
import config from '../config/environment';

/**
 * Controlador simplificado para integração com Google Drive
 */
class DriveController {
  /**
   * Inicia o processo de autenticação com o Google Drive
   * @route GET /api/v1/drive/auth
   */
  public initiateAuth = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return unauthorizedResponse(res, MESSAGES.VALIDATION.INVALID_CREDENTIALS);
      }

      const state = jwt.sign(
        { userId },
        config.JWT_SECRET,
        { expiresIn: '30m' }
      );

      const authUrl = driveService.generateAuthUrl(state);

      return successResponse(res, { authUrl }, 'URL de autenticação do Google Drive gerada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Processa o callback de autenticação do Google Drive
   * @route GET /api/v1/drive/callback
   */
  public handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        // Se não há código ou estado, redirecionar para o frontend com erro
        return res.redirect(`${config.CORS_ORIGIN}/drive/callback?error=missing_params`);
      }

      // Verificar e decodificar o state parameter para obter o userId
      let userId: string;
      try {
        const decoded = jwt.verify(state.toString(), config.JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        // Token de estado inválido, redirecionar para o frontend com erro
        return res.redirect(`${config.CORS_ORIGIN}/drive/callback?error=invalid_state`);
      }

      // Processar o código de autorização
      await driveService.handleAuthCallback(code.toString(), userId);

      // Gerar um token de confirmação para o frontend
      const confirmationToken = jwt.sign(
        {
          userId,
          driveConnected: true,
          timestamp: Date.now()
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Redirecionar para o frontend com token de sucesso
      return res.redirect(`${config.CORS_ORIGIN}/drive/callback?token=${confirmationToken}`);
    } catch (error) {
      // Em caso de erro, redirecionar para o frontend com mensagem de erro
      const errorMessage = error instanceof Error ?
        encodeURIComponent(error.message) :
        'unknown_error';

      return res.redirect(`${config.CORS_ORIGIN}/drive/callback?error=${errorMessage}`);
    }
  }
  /**
   * Lista arquivos do Google Drive do usuário
   * @route GET /api/v1/drive/files
   */
  public listFiles = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return unauthorizedResponse(res, MESSAGES.VALIDATION.INVALID_CREDENTIALS);
      }

      // Verificar se o usuário tem acesso ao Google Drive
      const hasAccess = await driveService.hasAccess(userId);
      if (!hasAccess) {
        return unauthorizedResponse(res, 'Usuário não está conectado ao Google Drive');
      }

      const { search, page, limit, folderId, mimeType } = req.query;

      const files = await driveService.listFiles(userId, {
        search: search?.toString(),
        page: page ? parseInt(page.toString()) : undefined,
        limit: limit ? parseInt(limit.toString()) : undefined,
        folderId: folderId?.toString(),
        mimeType: mimeType?.toString()
      });

      return successResponse(res, files, 'Arquivos do Google Drive listados com sucesso');
    } catch (error) {
      next(error);
    }
  }


  /**
   * Obtém detalhes de um arquivo específico do Google Drive
   * @route GET /api/v1/drive/files/:fileId
   */
  public getFileDetails = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;
      const { fileId } = req.params;

      if (!userId) {
        return unauthorizedResponse(res, MESSAGES.VALIDATION.INVALID_CREDENTIALS);
      }

      // Verificar se o usuário tem acesso ao Google Drive
      const hasAccess = await driveService.hasAccess(userId);
      if (!hasAccess) {
        return unauthorizedResponse(res, 'Usuário não está conectado ao Google Drive');
      }

      const fileDetails = await driveService.getFileDetails(userId, fileId);

      return successResponse(res, fileDetails, 'Detalhes do arquivo do Google Drive obtidos com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém URL para download de um arquivo
   * @route GET /api/v1/drive/files/:fileId/download
   */
  public getDownloadUrl = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;
      const { fileId } = req.params;

      if (!userId) {
        return unauthorizedResponse(res, MESSAGES.VALIDATION.INVALID_CREDENTIALS);
      }

      // Verificar se o usuário tem acesso ao Google Drive
      const hasAccess = await driveService.hasAccess(userId);
      if (!hasAccess) {
        return unauthorizedResponse(res, 'Usuário não está conectado ao Google Drive');
      }

      const downloadUrl = await driveService.getDownloadUrl(userId, fileId);

      return successResponse(res, { downloadUrl }, 'URL de download gerada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica se o usuário tem acesso ao Google Drive
   * @route GET /api/v1/drive/status
   */
  public checkStatus = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return unauthorizedResponse(res, MESSAGES.VALIDATION.INVALID_CREDENTIALS);
      }

      const hasAccess = await driveService.hasAccess(userId);

      return successResponse(res, { connected: hasAccess }, 'Status do Google Drive verificado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoga o acesso ao Google Drive para o usuário atual
   * @route POST /api/v1/drive/revoke
   */
  public revokeAccess = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return unauthorizedResponse(res, MESSAGES.VALIDATION.INVALID_CREDENTIALS);
      }

      const success = await driveService.revokeAccess(userId);

      return successResponse(res, { revoked: success }, 'Acesso ao Google Drive revogado com sucesso');
    } catch (error) {
      next(error);
    }
  }
}

export default new DriveController();