import { Request, Response, NextFunction } from 'express';
import noteService from '../services/note.service';
import {
  successResponse,
  createdResponse,
  notFoundResponse
} from '../utils/responseHandler';

/**
 * Controlador de notas
 */
class NoteController {
  /**
   * Cria uma nova nota
   * @route POST /api/v1/notes
   */
  public async createNote(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const note = await noteService.createNote(req.body, req.user.id);
      return createdResponse(res, note, 'Nota criada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma nota existente
   * @route PUT /api/v1/notes/:id
   */
  public async updateNote(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const note = await noteService.updateNote(req.params.id, req.body, req.user.id);
      return successResponse(res, note, 'Nota atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma nota pelo ID
   * @route GET /api/v1/notes/:id
   */
  public async getNoteById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const note = await noteService.getNoteById(req.params.id, req.user.id);
      return successResponse(res, note);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista notas com filtros e paginação
   * @route GET /api/v1/notes
   */
  public async getNotes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const {
        category,
        search,
        isPinned,
        tags,
        createdStart,
        createdEnd,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await noteService.getNotes({
        category: category as any,
        search: search as string,
        isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
        tags: tags as any,
        createdStart: createdStart ? new Date(createdStart as string) : undefined,
        createdEnd: createdEnd ? new Date(createdEnd as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'asc' | 'desc') || undefined,
      }, req.user.id);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exclui uma nota pelo ID
   * @route DELETE /api/v1/notes/:id
   */
  public async deleteNote(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await noteService.deleteNote(req.params.id, req.user.id);
      return successResponse(res, null, 'Nota excluída com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Altera o status de fixação de uma nota
   * @route PATCH /api/v1/notes/:id/pin
   */
  public async pinNote(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const note = await noteService.togglePinStatus(req.params.id, true, req.user.id);
      return successResponse(res, note, 'Nota fixada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove o status de fixação de uma nota
   * @route PATCH /api/v1/notes/:id/unpin
   */
  public async unpinNote(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const note = await noteService.togglePinStatus(req.params.id, false, req.user.id);
      return successResponse(res, note, 'Nota desfixada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém estatísticas das notas do usuário
   * @route GET /api/v1/notes/statistics
   */
  public async getNoteStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const statistics = await noteService.getNoteStatistics(req.user.id);
      return successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  }
}

export default new NoteController();