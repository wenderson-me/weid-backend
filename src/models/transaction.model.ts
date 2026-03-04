import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database';

export type TransactionType = 'income' | 'expense';

export interface TransactionAttributes {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdById: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes,
  'id' | 'description' | 'updatedById' | 'createdAt' | 'updatedAt'
> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes {
  declare public id: string;
  declare public userId: string;
  declare public type: TransactionType;
  declare public amount: number;
  declare public category: string;
  declare public description: string | undefined;
  declare public date: string;
  declare public createdById: string;
  declare public updatedById: string | undefined;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export const initTransactionModel = () => {
  const sequelize = getSequelize();

  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: { args: [0.01], msg: 'Valor deve ser maior que zero' },
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      updatedById: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      underscored: true,
    }
  );
};

export default Transaction;
