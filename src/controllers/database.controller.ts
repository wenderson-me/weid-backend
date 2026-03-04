import { Request, Response, NextFunction } from 'express';
import databaseService from '../services/database.service';
import { successResponse } from '../utils/responseHandler';

class DatabaseController {
  public async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const stats = await databaseService.getStats();
      return successResponse(res, stats, 'Estatísticas do banco de dados');
    } catch (error) {
      next(error);
    }
  }
}

export default new DatabaseController();
