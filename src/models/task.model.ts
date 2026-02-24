import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database';

export type TaskStatus = 'todo' | 'inProgress' | 'inReview' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAttributes {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  ownerId: string;
  assignees: string[];
  tags: string[];
  attachments?: string[];
  color?: string;
  isArchived: boolean;
  progress: number;
  position: number;
  createdById: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes,
  'id' | 'description' | 'status' | 'priority' | 'dueDate' | 'estimatedHours' | 'assignees' | 'tags' |
  'attachments' | 'color' | 'isArchived' | 'progress' | 'position' | 'updatedById' | 'createdAt' | 'updatedAt'
> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare public id: string;
  declare public title: string;
  declare public description: string | undefined;
  declare public status: TaskStatus;
  declare public priority: TaskPriority;
  declare public dueDate: Date | undefined;
  declare public estimatedHours: number | undefined;
  declare public ownerId: string;
  declare public assignees: string[];
  declare public tags: string[];
  declare public attachments: string[] | undefined;
  declare public color: string | undefined;
  declare public isArchived: boolean;
  declare public progress: number;
  declare public position: number;
  declare public createdById: string;
  declare public updatedById: string | undefined;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export const initTaskModel = () => {
  const sequelize = getSequelize();

  Task.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Título da tarefa é obrigatório' },
          len: {
            args: [3, 200],
            msg: 'Título deve ter entre 3 e 200 caracteres'
          }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'todo',
        validate: {
          isIn: {
            args: [['todo', 'inProgress', 'inReview', 'done']],
            msg: 'Status deve ser: todo, inProgress, inReview ou done'
          }
        }
      },
      priority: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'medium',
        validate: {
          isIn: {
            args: [['low', 'medium', 'high', 'urgent']],
            msg: 'Prioridade deve ser: low, medium, high ou urgent'
          }
        }
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      estimatedHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: { args: [0], msg: 'Horas estimadas não podem ser negativas' }
        }
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      assignees: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: []
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: []
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: 'Progresso mínimo é 0' },
          max: { args: [100], msg: 'Progresso máximo é 100' }
        }
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      updatedById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      sequelize,
      tableName: 'tasks',
      modelName: 'Task',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeSave: async (task: Task) => {
          if (task.status === 'done') {
            task.progress = 100;
          } else if (task.status === 'todo' && task.progress === 0) {
          } else if (task.status === 'inProgress' && task.progress === 0) {
            task.progress = 10;
          } else if (task.status === 'inReview' && task.progress < 70) {
            task.progress = 70;
          }
        }
      },
      indexes: [
        { fields: ['status'] },
        { fields: ['owner_id'] },
        { fields: ['due_date'] },
        { fields: ['created_at'] },
        { fields: ['is_archived'] }
      ]
    }
  );

  return Task;
};

export default Task;
