import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

export type NoteCategory = 'general' | 'personal' | 'work' | 'important' | 'idea';

export interface INote extends Document {
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId | IUser;
  category: NoteCategory;
  color?: string;
  isPinned: boolean;
  tags: string[];
  createdBy: mongoose.Types.ObjectId | IUser;
  updatedBy?: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Título da nota é obrigatório'],
      trim: true,
      minlength: [1, 'Título deve ter pelo menos 1 caractere'],
      maxlength: [200, 'Título deve ter no máximo 200 caracteres']
    },
    content: {
      type: String,
      required: [true, 'Conteúdo da nota é obrigatório'],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Nota deve ter um proprietário']
    },
    category: {
      type: String,
      enum: {
        values: ['general', 'personal', 'work', 'important', 'idea'],
        message: 'Categoria deve ser: general, personal, work, important ou idea'
      },
      default: 'general'
    },
    color: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^#([0-9A-F]{3}){1,2}$/i.test(v) ||
                 ['red', 'blue', 'green', 'yellow', 'purple', 'gray', 'orange', 'pink'].includes(v);
        },
        message: 'Cor deve ser um valor hexadecimal válido ou nome de cor CSS'
      }
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Criador da nota é obrigatório']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

noteSchema.index({ owner: 1, createdAt: -1 });
noteSchema.index({ category: 1 });
noteSchema.index({ isPinned: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ title: 'text', content: 'text' });

const Note = mongoose.model<INote>('Note', noteSchema);

export default Note;