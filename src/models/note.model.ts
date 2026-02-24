import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database';

export type NoteCategory = 'general' | 'personal' | 'work' | 'important' | 'idea';

export interface NoteAttributes {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  category: NoteCategory;
  color?: string;
  isPinned: boolean;
  tags: string[];
  createdById: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteCreationAttributes extends Optional<NoteAttributes,
  'id' | 'category' | 'color' | 'isPinned' | 'tags' | 'updatedById' | 'createdAt' | 'updatedAt'
> {}

class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  declare public id: string;
  declare public title: string;
  declare public content: string;
  declare public ownerId: string;
  declare public category: NoteCategory;
  declare public color: string | undefined;
  declare public isPinned: boolean;
  declare public tags: string[];
  declare public createdById: string;
  declare public updatedById: string | undefined;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export const initNoteModel = () => {
  const sequelize = getSequelize();

  Note.init(
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
          notEmpty: { msg: 'Título da nota é obrigatório' },
          len: {
            args: [1, 200],
            msg: 'Título deve ter entre 1 e 200 caracteres'
          }
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Conteúdo da nota é obrigatório' }
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
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'general',
        validate: {
          isIn: {
            args: [['general', 'personal', 'work', 'important', 'idea']],
            msg: 'Categoria deve ser: general, personal, work, important ou idea'
          }
        }
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
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
      tableName: 'notes',
      modelName: 'Note',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['owner_id'] },
        { fields: ['category'] },
        { fields: ['is_pinned'] },
        { fields: ['created_at'] }
      ]
    }
  );

  return Note;
};

export default Note;
