#!/usr/bin/env ts-node

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectDB, getSequelize } from '../config/database';
import { initModels } from '../models/index.pg';

async function createTables() {
  try {
    console.log('Conectando ao banco de dados...');
    await connectDB();

    console.log('Inicializando modelos...');
    await initModels();

    console.log('Sincronizando tabelas...');
    const sequelize = getSequelize();
    await sequelize.sync({ force: false, alter: false });

    console.log('✅ Tabelas criadas/sincronizadas com sucesso!');

    // Listar todas as tabelas criadas
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tabelas no banco:');
    (tables as any[]).forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', (error as Error).message);
    console.error(error);
    process.exit(1);
  }
}

createTables();
