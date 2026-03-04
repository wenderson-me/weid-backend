import { getSequelize } from '../config/database';
import config from '../config/environment';

export interface TableStat {
  table: string;
  rows: number;
  size: string;
  sizeBytes: number;
  lastVacuum: string | null;
  lastAnalyze: string | null;
}

export interface DatabaseStats {
  dbName: string;
  dbSize: string;
  dbSizeBytes: number;
  tables: TableStat[];
  connections: number;
  uptime: string;
  version: string;
}

class DatabaseService {
  async getStats(): Promise<DatabaseStats> {
    const seq = getSequelize();

    const [tables] = await seq.query(`
      SELECT
        relname                                          AS "table",
        COALESCE(n_live_tup, 0)                         AS "rows",
        pg_size_pretty(pg_total_relation_size(relid))   AS "size",
        pg_total_relation_size(relid)                   AS "sizeBytes",
        to_char(last_vacuum,   'DD/MM/YYYY HH24:MI')    AS "lastVacuum",
        to_char(last_analyze,  'DD/MM/YYYY HH24:MI')    AS "lastAnalyze"
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
    `) as [TableStat[], unknown];

    const [[dbSizeRow]] = await seq.query(`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS "size",
        pg_database_size(current_database())                  AS "sizeBytes"
    `) as [[{ size: string; sizeBytes: number }], unknown];

    const [[connRow]] = await seq.query(`
      SELECT count(*)::int AS "count"
      FROM pg_stat_activity
      WHERE datname = current_database()
    `) as [[{ count: number }], unknown];

    const [[uptimeRow]] = await seq.query(`
      SELECT to_char(now() - pg_postmaster_start_time(), 'DD"d" HH24"h" MI"m"') AS "uptime"
    `) as [[{ uptime: string }], unknown];

    const [[versionRow]] = await seq.query(`
      SELECT version() AS "version"
    `) as [[{ version: string }], unknown];

    const shortVersion = versionRow.version.match(/PostgreSQL ([\d.]+)/)?.[1] ?? versionRow.version;

    return {
      dbName: config.POSTGRES_DB,
      dbSize: dbSizeRow.size,
      dbSizeBytes: Number(dbSizeRow.sizeBytes),
      tables,
      connections: connRow.count,
      uptime: uptimeRow.uptime,
      version: shortVersion,
    };
  }
}

export default new DatabaseService();
