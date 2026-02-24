import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

export type TaskStatus = 'todo' | 'inProgress' | 'inReview' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  owner: mongoose.Types.ObjectId | IUser;
  assignees: (mongoose.Types.ObjectId | IUser)[];
  tags: string[];
  attachments?: string[];
  color?: string;
  isArchived: boolean;
  progress: number;
  position: number;
  createdBy: mongoose.Types.ObjectId | IUser;
  updatedBy?: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Título da tarefa é obrigatório'],
      trim: true,
      minlength: [3, 'Título deve ter pelo menos 3 caracteres'],
      maxlength: [200, 'Título deve ter no máximo 200 caracteres']
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'inProgress', 'inReview', 'done'],
        message: 'Status deve ser: todo, inProgress, inReview ou done'
      },
      default: 'todo'
    },
    position: {
      type: Number,
      default: 0
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Prioridade deve ser: low, medium, high ou urgent'
      },
      default: 'medium'
    },
    dueDate: {
      type: Date
    },
    estimatedHours: {
      type: Number,
      min: [0, 'Horas estimadas não podem ser negativas']
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tarefa deve ter um proprietário']
    },
    assignees: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    tags: [{
      type: String,
      trim: true
    }],
    attachments: [{
      type: String
    }],
    color: {
      type: String,
      validate: {
        validator: function(v: string) {
          return /^#([0-9A-F]{3}){1,2}$/i.test(v) ||
                 ['red', 'blue', 'green', 'yellow', 'purple', 'gray', 'orange', 'pink'].includes(v);
        },
        message: 'Cor deve ser um valor hexadecimal válido ou nome de cor CSS'
      }
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Criador da tarefa é obrigatório']
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

taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task'
});

taskSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'task'
});

taskSchema.pre<ITask>('save', function(next) {
  if (this.status === 'done') {
    this.progress = 100;
  } else if (this.status === 'todo' && this.progress === 0) {
  } else if (this.status === 'inProgress' && this.progress === 0) {
    this.progress = 10;
  } else if (this.status === 'inReview' && this.progress < 70) {
    this.progress = 70;
  }
  next();
});

taskSchema.index({ status: 1 });
taskSchema.index({ owner: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: 1 });
taskSchema.index({ isArchived: 1 });

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;