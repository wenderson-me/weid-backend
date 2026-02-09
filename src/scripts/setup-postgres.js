#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'weid_db',
};

async function setupDatabase() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Conectado...');

    const sqlPath = path.join(__dirname, 'init-postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');


    await client.query(sql);
    console.log('Banco de dados inicializado!');

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n Setup concluído!');

  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
