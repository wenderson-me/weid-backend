
import { Sequelize } from 'sequelize';
import { getSequelize } from '../config/database';
import User, { initUserModel } from './user.pg.model';
// import Task, { initTaskModel } from './task.pg.model';
// import Note, { initNoteModel } from './note.pg.model';
// import Comment, { initCommentModel } from './comment.pg.model';
// import Activity, { initActivityModel } from './activity.pg.model';

let initialized = false;

export const initModels = async () => {
  if (initialized) {
    return;
  }

  const sequelize = getSequelize();

  // Inicializar todos os modelos
  initUserModel();
  // initTaskModel();
  // initNoteModel();
  // initCommentModel();
  // initActivityModel();

  // Definir relacionamentos entre modelos
  setupAssociations();


  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados com PostgreSQL');
  }

  initialized = true;
};

const setupAssociations = () => {
  // User.hasMany(Task, {
  //   foreignKey: 'userId',
  //   as: 'tasks',
  //   onDelete: 'CASCADE'
  // });
  // Task.belongsTo(User, {
  //   foreignKey: 'userId',
  //   as: 'user'
  // });

  // User.hasMany(Note, {
  //   foreignKey: 'userId',
  //   as: 'notes',
  //   onDelete: 'CASCADE'
  // });
  // Note.belongsTo(User, {
  //   foreignKey: 'userId',
  //   as: 'user'
  // });

  // User.hasMany(Comment, {
  //   foreignKey: 'userId',
  //   as: 'comments',
  //   onDelete: 'CASCADE'
  // });
  // Comment.belongsTo(User, {
  //   foreignKey: 'userId',
  //   as: 'user'
  // });

  // Task.hasMany(Comment, {
  //   foreignKey: 'taskId',
  //   as: 'comments',
  //   onDelete: 'CASCADE'
  // });
  // Comment.belongsTo(Task, {
  //   foreignKey: 'taskId',
  //   as: 'task'
  // });

  // Note.hasMany(Comment, {
  //   foreignKey: 'noteId',
  //   as: 'comments',
  //   onDelete: 'CASCADE'
  // });
  // Comment.belongsTo(Note, {
  //   foreignKey: 'noteId',
  //   as: 'note'
  // });

  // Comment.hasMany(Comment, {
  //   foreignKey: 'parentId',
  //   as: 'replies',
  //   onDelete: 'CASCADE'
  // });
  // Comment.belongsTo(Comment, {
  //   foreignKey: 'parentId',
  //   as: 'parent'
  // });

  // User.hasMany(Activity, {
  //   foreignKey: 'userId',
  //   as: 'activities',
  //   onDelete: 'CASCADE'
  // });
  // Activity.belongsTo(User, {
  //   foreignKey: 'userId',
  //   as: 'user'
  // });
};

export {
  User,
  // Task,
  // Note,
  // Comment,
  // Activity
};

export default {
  User,
  // Task,
  // Note,
  // Comment,
  // Activity,
  initModels
};
