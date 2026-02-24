import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database';

export interface CommentAttributes {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  attachments?: string[];
  likes: string[];
  isEdited: boolean;
  parentCommentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes,
  'id' | 'attachments' | 'likes' | 'isEdited' | 'parentCommentId' | 'createdAt' | 'updatedAt'
> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public content!: string;
  public taskId!: string;
  public authorId!: string;
  public attachments?: string[];
  public likes!: string[];
  public isEdited!: boolean;
  public parentCommentId?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initCommentModel = () => {
  const sequelize = getSequelize();

  Comment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Conteúdo é obrigatório' },
          len: {
            args: [1, 5000],
            msg: 'Conteúdo não pode exceder 5000 caracteres'
          }
        }
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: []
      },
      likes: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: []
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      parentCommentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    },
    {
      sequelize,
      tableName: 'comments',
      modelName: 'Comment',
      timestamps: true,
      underscored: true,
      validate: {
        parentNotSelf() {
          if (this.parentCommentId && this.parentCommentId === this.id) {
            throw new Error('Um comentário não pode ser seu próprio pai');
          }
        }
      },
      indexes: [
        { fields: ['task_id', 'created_at'] },
        { fields: ['parent_comment_id'] },
        { fields: ['author_id'] }
      ]
    }
  );

  return Comment;
};

export default Comment;
