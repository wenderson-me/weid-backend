import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';
import { ITask } from './task.model';

export interface IComment extends Document {
  content: string;
  task: mongoose.Types.ObjectId | ITask;
  author: mongoose.Types.ObjectId | IUser;
  attachments?: string[];
  likes: mongoose.Types.ObjectId[] | IUser[];
  isEdited: boolean;
  parentComment?: mongoose.Types.ObjectId | IComment;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required']
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    },
    attachments: {
      type: [String],
      default: []
    },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: []
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  options: { sort: { createdAt: 1 } }
});


commentSchema.pre('save', function(next) {
  if (this.parentComment && this.parentComment.toString() === this._id.toString()) {
    const error = new Error('A comment cannot be its own parent');
    return next(error);
  }
  next();
});

commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;