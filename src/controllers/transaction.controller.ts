import { Request, Response, NextFunction } from 'express';
import transactionService from '../services/transaction.service';
import { successResponse, createdResponse, errorResponse } from '../utils/responseHandler';

class TransactionController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tx = await transactionService.create(req.body, req.user!.id);
      return createdResponse(res, tx, 'Transação criada');
    } catch (e) { next(e); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tx = await transactionService.update(req.params.id, req.body, req.user!.id);
      return successResponse(res, tx, 'Transação atualizada');
    } catch (e) { next(e); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await transactionService.delete(req.params.id, req.user!.id);
      return successResponse(res, null, 'Transação excluída');
    } catch (e) { next(e); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transactionService.list(req.user!.id, req.query as any);
      return successResponse(res, result);
    } catch (e) { next(e); }
  };

  summary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await transactionService.summary(req.user!.id, req.query.month as string);
      return successResponse(res, data);
    } catch (e) { next(e); }
  };
}

export default new TransactionController();
