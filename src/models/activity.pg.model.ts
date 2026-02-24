import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database';

export type ActivityType =
  'task_created' |
  'task_updated' |
  'task_status_changed' |
  'task_assigned' |
  'task_unassigned' |
  'task_completed' |
  'task_reopened' |
  'task_archived' |
  'attachment_added' |
  'due_date_changed' |
  'comment_added' |

  'note_created' |
  'note_updated' |
  'note_pinned' |
  'note_unpinned' |
  'note_deleted' |

  'profile_updated' |
  'avatar_changed' |
  'preferences_updated' |
  'password_changed';

export interface ActivityAttributes {
  id: string;
  type: ActivityType;
  taskId?: string;
  noteId?: string;
  userId: string;
  targetUserId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes,
  'id' | 'taskId' | 'noteId' | 'targetUserId' | 'metadata' | 'createdAt'
> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: string;
  public type!: ActivityType;
  public taskId?: string;
  public noteId?: string;
  public userId!: string;
  public targetUserId?: string;
  public description!: string;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
}

export const initActivityModel = () => {
  const sequelize = getSequelize();

  Activity.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isIn: {
            args: [[
              'task_created',
              'task_updated',
              'task_status_changed',
              'task_assigned',
              'task_unassigned',
              'task_completed',
              'task_reopened',
              'task_archived',
              'attachment_added',
              'due_date_changed',
              'comment_added',
              'note_created',
              'note_updated',
              'note_pinned',
              'note_unpinned',
              'note_deleted',
              'profile_updated',
              'avatar_changed',
              'preferences_updated',
              'password_changed'
            ]],
            msg: 'Tipo de atividade inválido'
          }
        }
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      noteId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'notes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      targetUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Descrição da atividade é obrigatória' }
        }
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'activities',
      modelName: 'Activity',
      timestamps: true,
      updatedAt: false,
      underscored: true,
      indexes: [
        { fields: ['user_id', 'created_at'] },
        { fields: ['task_id'] },
        { fields: ['note_id'] },
        { fields: ['type'] },
        { fields: ['created_at'] }
      ]
    }
  );

  return Activity;
};

export default Activity;
