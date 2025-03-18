import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';
import { ITask } from './task.model';
import { INote } from './note.model';

// Tipos de atividades
export type ActivityType =
  // Atividades de Tarefas
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

  // Atividades de Notas
  'note_created' |
  'note_updated' |
  'note_pinned' |
  'note_unpinned' |
  'note_deleted' |

  // Atividades de Perfil
  'profile_updated' |
  'avatar_changed' |
  'preferences_updated' |
  'password_changed';

export interface IActivity extends Document {
  type: ActivityType;
  task?: mongoose.Types.ObjectId | ITask;
  note?: mongoose.Types.ObjectId | INote;
  user: mongoose.Types.ObjectId | IUser;
  targetUser?: mongoose.Types.ObjectId | IUser; // Para ações que afetam outro usuário
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      required: [true, 'Tipo de atividade é obrigatório'],
      enum: {
        values: [
          // Atividades de Tarefas
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

          // Atividades de Notas
          'note_created',
          'note_updated',
          'note_pinned',
          'note_unpinned',
          'note_deleted',

          // Atividades de Perfil
          'profile_updated',
          'avatar_changed',
          'preferences_updated',
          'password_changed'
        ],
        message: 'Tipo de atividade inválido'
      }
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      // Não é mais obrigatório, já que nem todas as atividades estão relacionadas a tarefas
    },
    note: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      // Para atividades relacionadas a notas
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Usuário que realizou a atividade é obrigatório']
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Para atividades que afetam outro usuário
    },
    description: {
      type: String,
      required: [true, 'Descrição da atividade é obrigatória']
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Impede a atualização de atividades - elas devem ser somente inseridas
activitySchema.pre<IActivity>('findOneAndUpdate', function(next) {
  const err = new Error('Atividades não podem ser atualizadas');
  next(err);
});

// Validação para garantir que pelo menos um dos campos de referência seja fornecido
activitySchema.pre<IActivity>('validate', function(next) {
  // Se for atividade de tarefa, o ID da tarefa é obrigatório
  if (this.type.startsWith('task_') && !this.task) {
    return next(new Error('ID da tarefa é obrigatório para atividades de tarefa'));
  }

  // Se for atividade de nota, o ID da nota é obrigatório
  if (this.type.startsWith('note_') && !this.note) {
    return next(new Error('ID da nota é obrigatório para atividades de nota'));
  }

  // Se for atividade de perfil, targetUser pode ser necessário
  if ((this.type === 'profile_updated' || this.type === 'avatar_changed' ||
       this.type === 'preferences_updated' || this.type === 'password_changed') &&
      !this.targetUser) {
    this.targetUser = this.user; // Se não foi especificado, assume que é o próprio usuário
  }

  next();
});

// Índices para melhorar performance
activitySchema.index({ task: 1, createdAt: -1 });
activitySchema.index({ note: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ targetUser: 1, createdAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;