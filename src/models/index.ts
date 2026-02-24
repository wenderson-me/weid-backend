import { Sequelize } from 'sequelize';
import { getSequelize } from '../config/database';
import User, { initUserModel } from './user.model';
import Task, { initTaskModel } from './task.model';
import Note, { initNoteModel } from './note.model';
import Comment, { initCommentModel } from './comment.model';
import Activity, { initActivityModel } from './activity.model';

let initialized = false;

export const initModels = async () => {
  if (initialized) {
    return;
  }

  const sequelize = getSequelize();

  initUserModel();
  initTaskModel();
  initNoteModel();
  initCommentModel();
  initActivityModel();

  setupAssociations();

  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados com PostgreSQL');
  }

  initialized = true;
};

const setupAssociations = () => {
  Task.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
  });

  Task.belongsTo(User, {
    foreignKey: 'createdById',
    as: 'createdBy'
  });

  Task.belongsTo(User, {
    foreignKey: 'updatedById',
    as: 'updatedBy'
  });

  User.hasMany(Task, {
    foreignKey: 'ownerId',
    as: 'ownedTasks'
  });

  Note.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
  });

  Note.belongsTo(User, {
    foreignKey: 'createdById',
    as: 'createdBy'
  });

  Note.belongsTo(User, {
    foreignKey: 'updatedById',
    as: 'updatedBy'
  });

  User.hasMany(Note, {
    foreignKey: 'ownerId',
    as: 'notes'
  });

  Comment.belongsTo(Task, {
    foreignKey: 'taskId',
    as: 'task'
  });

  Task.hasMany(Comment, {
    foreignKey: 'taskId',
    as: 'comments'
  });

  Comment.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
  });

  User.hasMany(Comment, {
    foreignKey: 'authorId',
    as: 'comments'
  });

  Comment.hasMany(Comment, {
    foreignKey: 'parentCommentId',
    as: 'replies'
  });

  Comment.belongsTo(Comment, {
    foreignKey: 'parentCommentId',
    as: 'parent'
  });

  Activity.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  Activity.belongsTo(User, {
    foreignKey: 'targetUserId',
    as: 'targetUser'
  });

  User.hasMany(Activity, {
    foreignKey: 'userId',
    as: 'activities'
  });

  Activity.belongsTo(Task, {
    foreignKey: 'taskId',
    as: 'task'
  });

  Task.hasMany(Activity, {
    foreignKey: 'taskId',
    as: 'activities'
  });

  Activity.belongsTo(Note, {
    foreignKey: 'noteId',
    as: 'note'
  });

  Note.hasMany(Activity, {
    foreignKey: 'noteId',
    as: 'activities'
  });
};

export {
  User,
  Task,
  Note,
  Comment,
  Activity
};

export default {
  User,
  Task,
  Note,
  Comment,
  Activity,
  initModels
};
