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
        return unauthorizedResponse(res, 'Parâmetros de autenticação inválidos ou ausentes');
      }

      // Verificar e decodificar o state parameter para obter o userId
      let userId: string;
      try {
        const decoded = jwt.verify(state.toString(), config.JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        return unauthorizedResponse(res, 'Token de estado inválido ou expirado');
      }

      await driveService.handleAuthCallback(code.toString(), userId);

      // Redirecionar para uma página de sucesso
      return res.send(`
        <html>
          <head>
            <title>Conexão com Google Drive</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .success { color: #4CAF50; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">Conexão Estabelecida!</h1>
              <p>Sua conta do Google Drive foi conectada com sucesso.</p>
              <p>Você pode fechar esta janela e retornar ao aplicativo.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      // Em caso de erro, mostrar uma página de erro ao invés de JSON
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).send(`
        <html>
          <head>
            <title>Erro na Conexão</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: #f44336; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Erro na Conexão</h1>
              <p>Não foi possível conectar ao Google Drive:</p>
              <p>${errorMessage}</p>
              <p>Por favor, tente novamente.</p>
            </div>
          </body>
        </html>
      `);
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