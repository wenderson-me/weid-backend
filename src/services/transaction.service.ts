import { Op } from 'sequelize';
import { AppError } from '../middleware/error.middleware';
import Transaction from '../models/transaction.model';

export interface CreateTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface TransactionFilters {
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class TransactionService {
  async create(data: CreateTransactionInput, userId: string) {
    const tx = await Transaction.create({
      ...data,
      amount: parseFloat(String(data.amount)),
      userId,
      createdById: userId,
    });
    return tx;
  }

  async update(id: string, data: Partial<CreateTransactionInput>, userId: string) {
    const tx = await Transaction.findOne({ where: { id, userId } });
    if (!tx) throw new AppError('Transação não encontrada', 404);

    if (data.amount !== undefined) data.amount = parseFloat(String(data.amount));
    await tx.update({ ...data, updatedById: userId });
    return tx;
  }

  async delete(id: string, userId: string) {
    const tx = await Transaction.findOne({ where: { id, userId } });
    if (!tx) throw new AppError('Transação não encontrada', 404);
    await tx.destroy();
  }

  async list(userId: string, filters: TransactionFilters = {}) {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = filters;
    const where: any = { userId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate)   where.date[Op.lte] = endDate;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      transactions: rows,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  }

  async summary(userId: string, month?: string) {
    const now = new Date();
    const y = month ? parseInt(month.split('-')[0]) : now.getFullYear();
    const m = month ? parseInt(month.split('-')[1]) : now.getMonth() + 1;
    const start = `${y}-${String(m).padStart(2,'0')}-01`;
    const end   = new Date(y, m, 0).toISOString().split('T')[0];

    const rows = await Transaction.findAll({ where: { userId, date: { [Op.between]: [start, end] } } });

    const income  = rows.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(String(t.amount)), 0);
    const expense = rows.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(String(t.amount)), 0);

    const byCat: Record<string, { income: number; expense: number }> = {};
    rows.forEach(t => {
      if (!byCat[t.category]) byCat[t.category] = { income: 0, expense: 0 };
      byCat[t.category][t.type] += parseFloat(String(t.amount));
    });

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d  = new Date(y, m - 1 - i, 1);
      const ms = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
      const me = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split('T')[0];
      const tr = await Transaction.findAll({ where: { userId, date: { [Op.between]: [ms, me] } } });
      trend.push({
        month: `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
        income:  tr.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(String(t.amount)), 0),
        expense: tr.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(String(t.amount)), 0),
      });
    }

    return { income, expense, balance: income - expense, byCat, trend, month: `${y}-${String(m).padStart(2,'0')}` };
  }
}

export default new TransactionService();
