import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import transactionController from '../controllers/transaction.controller';

const router = Router();
router.use(authenticate);

router.get('/',          transactionController.list);
router.get('/summary',   transactionController.summary);
router.post('/',         transactionController.create);
router.put('/:id',       transactionController.update);
router.delete('/:id',    transactionController.delete);

export default router;
