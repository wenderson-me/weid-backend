import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model';
import Task from '../models/task.model';

dotenv.config();

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@weid.com',
    password: 'Admin123!',
    role: 'admin'
  },
];

const seedTasks = [
  {
    title: 'Configurar ambiente de desenvolvimento',
    description: 'Instalar todas as ferramentas necessárias',
    status: 'done',
    priority: 'high',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');

    await User.deleteMany({});
    await Task.deleteMany({});

    const users = await User.create(seedUsers);

    const tasksWithUsers = seedTasks.map((task, index) => ({
      ...task,
      owner: users[0]._id,
      createdBy: users[0]._id,
      assignees: [users[index % users.length]._id]

    }));

    await Task.create(tasksWithUsers);

    console.log('Database seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();


/*
npx ts-node scripts/seed/index.ts
*/