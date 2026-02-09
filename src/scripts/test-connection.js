#!/usr/bin/env node

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'weid_db',
};

async function testConnection() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Conectado...');

    const versionResult = await client.query('SELECT version();');
    console.log('PostgreSQL Version:', versionResult.rows[0].version.split(',')[0]);

    const dbResult = await client.query('SELECT current_database(), current_user;');
    console.log('Database:', dbResult.rows[0].current_database);
    console.log('User:', dbResult.rows[0].current_user);

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nTabelas encontradas:');
    if (tablesResult.rows.length === 0) {
      console.log('  (nenhuma tabela encontrada)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }

    console.log('\n Teste finalizado');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
