import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import DriveToken from '../models/driveToken.model';
import { AppError } from '../middleware/error.middleware';
import config from '../config/environment';
import logger from '../config/logger';

/**
 * Interface para retorno de objetos da API do Google Drive
 */
export interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  iconLink?: string;
  size?: number;
  modifiedTime?: string;
}

/**
 * Serviço simplificado para interação com a API do Google Drive
 */
class DriveService {
  private oAuth2Client: OAuth2Client;

  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Gera a URL de autorização para o Google Drive
   * @returns URL de autorização
   */
  public generateAuthUrl(state: string): string {
    const scopes = config.GOOGLE_API_SCOPES.split(',');

    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state
    });
  }

  /**
   * Processa o código de autorização retornado pelo Google após autenticação
   * @param code Código de autorização
   * @param userId ID do usuário
   * @returns Token de acesso ao Drive
   */
  public async handleAuthCallback(code: string, userId: string): Promise<{ success: boolean }> {
    try {
      // Troca o código por tokens
      const { tokens } = await this.oAuth2Client.getToken(code);

      if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
        throw new AppError('Tokens incompletos retornados pelo Google', 400);
      }


      // Atualiza ou cria o registro de token do usuário
      const expiryDate = new Date(tokens.expiry_date);

      await DriveToken.findOneAndUpdate(
        { user: userId },
        {
          user: userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate
        },
        { new: true, upsert: true }
      );

      return { success: true };
    } catch (error) {
      logger.error('Erro ao processar callback de autenticação do Google Drive:', error);
      throw new AppError('Falha na autenticação com o Google Drive', 500);
    }
  }

  /**
   * Obtém um cliente autorizado do Google Drive para um usuário
   * @param userId ID do usuário
   * @returns Cliente autorizado do Google Drive
   */
  private async getAuthorizedDriveClient(userId: string): Promise<drive_v3.Drive> {
    // Busca o token do usuário
    const tokenDoc = await DriveToken.findOne({ user: userId });

    if (!tokenDoc) {
      throw new AppError('Usuário não autenticado com o Google Drive', 401);
    }

    // Configura as credenciais
    this.oAuth2Client.setCredentials({
      access_token: tokenDoc.accessToken,
      refresh_token: tokenDoc.refreshToken
    });

    // Verifica se o token expirou e precisa ser atualizado
    if (new Date() > tokenDoc.expiryDate) {
      try {
        const { credentials } = await this.oAuth2Client.refreshAccessToken();

        // Atualiza o token no banco de dados
        if (credentials.access_token && credentials.expiry_date) {
          tokenDoc.accessToken = credentials.access_token;
          tokenDoc.expiryDate = new Date(credentials.expiry_date);
          await tokenDoc.save();
        }
      } catch (error) {
        logger.error('Erro ao atualizar token do Google Drive:', error);
        throw new AppError('Falha ao atualizar autenticação com o Google Drive', 401);
      }
    }

    // Cria e retorna o cliente do Drive
    return google.drive({ version: 'v3', auth: this.oAuth2Client });
  }

  /**
   * Lista arquivos do Google Drive do usuário
   * @param userId ID do usuário
   * @param query Parâmetros de consulta (pesquisa, página, limite)
   * @returns Lista de arquivos
   */
  public async listFiles(
    userId: string,
    query: {
      search?: string;
      page?: number;
      limit?: number;
      folderId?: string;
      mimeType?: string;
    }
  ): Promise<{
    files: DriveFileResponse[];
    nextPageToken?: string;
  }> {
    try {
      const drive = await this.getAuthorizedDriveClient(userId);

      // Configura os parâmetros da consulta
      const { search, page = 1, limit = 20, folderId, mimeType } = query;
      const pageSize = Math.min(100, Math.max(1, limit)); // Entre 1 e 100
      const pageToken = page > 1 ? `page${page}` : undefined;

      let q = "trashed = false";

      if (search) {
        q += ` and name contains '${search}'`;
      }

      if (mimeType) {
        q += ` and mimeType = '${mimeType}'`;
      }

      if (folderId) {
        q += ` and '${folderId}' in parents`;
      }

      const response = await drive.files.list({
        q,
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, iconLink, size, modifiedTime)'
      });

      return {
        files: response.data.files as DriveFileResponse[] || [],
        nextPageToken: response.data.nextPageToken ?? undefined
      };
    } catch (error) {
      logger.error('Erro ao listar arquivos do Google Drive:', error);
      throw new AppError('Falha ao listar arquivos do Google Drive', 500);
    }
  }

  /**
   * Obtém detalhes de um arquivo específico do Google Drive
   * @param userId ID do usuário
   * @param fileId ID do arquivo no Google Drive
   * @returns Detalhes do arquivo
   */
  public async getFileDetails(userId: string, fileId: string): Promise<DriveFileResponse> {
    try {
      const drive = await this.getAuthorizedDriveClient(userId);

      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, webViewLink, thumbnailLink, iconLink, size, modifiedTime'
      });

      if (!response.data.id) {
        throw new AppError('Arquivo não encontrado', 404);
      }

      return response.data as DriveFileResponse;
    } catch (error) {
      logger.error('Erro ao obter detalhes do arquivo do Google Drive:', error);
      throw new AppError('Falha ao obter detalhes do arquivo do Google Drive', 500);
    }
  }

  /**
   * Gera URL temporária para download do arquivo
   * @param userId ID do usuário
   * @param fileId ID do arquivo no Google Drive
   * @returns URL para download
   */
  public async getDownloadUrl(userId: string, fileId: string): Promise<string> {
    try {
      const drive = await this.getAuthorizedDriveClient(userId);

      const response = await drive.files.get({
        fileId,
        alt: 'media',
        acknowledgeAbuse: true
      }, { responseType: 'stream' });

      // A URL seria usada para proxy o download, mas por simplicidade
      // retornamos a webViewLink para o arquivo

      const fileDetails = await this.getFileDetails(userId, fileId);
      return fileDetails.webViewLink;
    } catch (error) {
      logger.error('Erro ao gerar URL de download:', error);
      throw new AppError('Falha ao gerar URL de download', 500);
    }
  }

  /**
   * Verifica se o usuário tem acesso ao Google Drive
   * @param userId ID do usuário
   * @returns Booleano indicando se tem acesso
   */
  public async hasAccess(userId: string): Promise<boolean> {
    try {
      const tokenDoc = await DriveToken.findOne({ user: userId });
      return !!tokenDoc;
    } catch (error) {
      logger.error('Erro ao verificar acesso ao Google Drive:', error);
      throw new AppError('Falha ao verificar acesso ao Google Drive', 500);
    }
  }

  /**
   * Revoga o acesso ao Google Drive para um usuário
   * @param userId ID do usuário
   * @returns Booleano indicando sucesso
   */
  public async revokeAccess(userId: string): Promise<boolean> {
    try {
      // Busca o token do usuário
      const tokenDoc = await DriveToken.findOne({ user: userId });

      if (!tokenDoc) {
        // Se não existe token, considera como já revogado
        return true;
      }

      // Configura as credenciais
      this.oAuth2Client.setCredentials({
        access_token: tokenDoc.accessToken,
        refresh_token: tokenDoc.refreshToken
      });

      // Revoga o token
      await this.oAuth2Client.revokeToken(tokenDoc.accessToken);

      // Remove o registro do token
      await DriveToken.deleteOne({ user: userId });

      return true;
    } catch (error) {
      logger.error('Erro ao revogar acesso ao Google Drive:', error);
      throw new AppError('Falha ao revogar acesso ao Google Drive', 500);
    }
  }
}

export default new DriveService();