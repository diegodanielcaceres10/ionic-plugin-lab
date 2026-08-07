import { inject, Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { PlatformService } from '../platform/platform.service';

const DB_NAME = 'ionic_plugin_lab';
const DB_VERSION = 1;

/** Append new statements here on future schema changes — never edit a shipped one. */
const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS plugins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    link TEXT,
    is_tested INTEGER NOT NULL DEFAULT 0,
    is_favorited INTEGER NOT NULL DEFAULT 0,
    last_used_at TEXT
   );`,
  `CREATE TABLE IF NOT EXISTS plugin_logs (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     plugin TEXT NOT NULL,
     type TEXT NOT NULL,
     status TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );`,
  `CREATE INDEX IF NOT EXISTS idx_plugin_logs_plugin ON plugin_logs(plugin);`,
  `CREATE INDEX IF NOT EXISTS idx_plugin_logs_status ON plugin_logs(status);`,
];

export type WhereClause = Record<string, string | number | boolean>;

export interface SelectOptions {
  where?: WhereClause;
  orderBy?: string; // e.g. 'created_at DESC'
  limit?: number;
}

/** Row shape stored in-memory; every row gets an auto-incremented `id`. */
type MemoryRow = Record<string, unknown> & { id: number };

/**
 * Centralizes the SQLite connection lifecycle so every table-specific
 * service (plugins catalog, logs, etc.) shares the same open DB instead
 * of each one managing its own connection.
 *
 * On native platforms it talks to real SQLite. On web (no plugin
 * implementation available) it transparently falls back to an in-memory
 * store with the same `select/insert/update` API — useful for local
 * browser testing, but NOT persisted across reloads.
 */
@Injectable({ providedIn: 'root' })
export class SqliteService {
  private platformService = inject(PlatformService);
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private dbPromise?: Promise<SQLiteDBConnection>;

  private readonly isNative = this.platformService.isNativePlatform();

  // ---- in-memory backend (web) ----
  private memoryStore = new Map<string, MemoryRow[]>();
  private memoryAutoIncrement = new Map<string, number>();

  /** Lazily opens (or returns the already-open) native app database. */
  getDb(): Promise<SQLiteDBConnection> {
    if (!this.isNative) {
      return Promise.reject(new SqliteNotSupportedError());
    }
    if (!this.dbPromise) {
      this.dbPromise = this.openDb();
    }
    return this.dbPromise;
  }

  private async openDb(): Promise<SQLiteDBConnection> {
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;
    const db = isConn
      ? await this.sqlite.retrieveConnection(DB_NAME, false)
      : await this.sqlite.createConnection(
          DB_NAME,
          false,
          'no-encryption',
          DB_VERSION,
          false,
        );

    await db.open();
    for (const statement of SCHEMA_STATEMENTS) {
      await db.execute(statement);
    }
    return db;
  }

  // ---------------------------------------------------------------------
  // Generic API — routes to SQLite or in-memory depending on platform.
  // ---------------------------------------------------------------------

  async select<T>(table: string, options: SelectOptions = {}): Promise<T[]> {
    if (this.isNative) {
      const db = await this.getDb();
      const { sql, values } = this.buildSelect(table, options);
      const result = await db.query(sql, values);
      return (result.values ?? []) as T[];
    }
    return this.memorySelect<T>(table, options);
  }

  async insert<T extends Record<string, unknown>>(
    table: string,
    data: Partial<T>,
  ): Promise<T> {
    if (this.isNative) {
      const db = await this.getDb();
      const keys = Object.keys(data);
      const columns = keys.join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((k) => (data as Record<string, unknown>)[k]);

      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      const result = await db.run(sql, values);
      return {
        ...(data as object),
        id: result.changes?.lastId,
      } as unknown as T;
    }
    return this.memoryInsert<T>(table, data);
  }

  /** Returns the number of affected rows. */
  async update<T extends Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    where: WhereClause,
  ): Promise<number> {
    if (this.isNative) {
      const db = await this.getDb();
      const setKeys = Object.keys(data);
      const whereKeys = Object.keys(where);

      const setClause = setKeys.map((k) => `${k} = ?`).join(', ');
      const whereClause = whereKeys.map((k) => `${k} = ?`).join(' AND ');
      const values = [
        ...setKeys.map((k) => (data as Record<string, unknown>)[k]),
        ...whereKeys.map((k) => where[k]),
      ];

      const sql = `UPDATE ${table} SET ${setClause}${
        whereClause ? ` WHERE ${whereClause}` : ''
      }`;
      const result = await db.run(sql, values);
      return result.changes?.changes ?? 0;
    }
    return this.memoryUpdate<T>(table, data, where);
  }

  // ---- SQL builder (native) ----

  private buildSelect(table: string, options: SelectOptions) {
    const { where, orderBy, limit } = options;
    const whereKeys = where ? Object.keys(where) : [];
    const whereClause = whereKeys.map((k) => `${k} = ?`).join(' AND ');

    let sql = `SELECT * FROM ${table}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    if (limit) sql += ` LIMIT ${limit}`;

    const values = whereKeys.map((k) => (where as WhereClause)[k]);
    return { sql, values };
  }

  // ---- in-memory backend ----

  private getTable(table: string): MemoryRow[] {
    if (!this.memoryStore.has(table)) this.memoryStore.set(table, []);
    return this.memoryStore.get(table)!;
  }

  private matchesWhere(row: MemoryRow, where?: WhereClause): boolean {
    if (!where) return true;
    return Object.entries(where).every(([k, v]) => row[k] === v);
  }

  private memorySelect<T>(table: string, options: SelectOptions): T[] {
    let rows = this.getTable(table).filter((r) =>
      this.matchesWhere(r, options.where),
    );

    if (options.orderBy) {
      const [col, dir] = options.orderBy.split(' ');
      const desc = dir?.toUpperCase() === 'DESC';
      rows = [...rows].sort((a, b) => {
        if (a[col]! < b[col]!) return desc ? 1 : -1;
        if (a[col]! > b[col]!) return desc ? -1 : 1;
        return 0;
      });
    }

    if (options.limit) rows = rows.slice(0, options.limit);
    return rows as unknown as T[];
  }

  private memoryInsert<T extends Record<string, unknown>>(
    table: string,
    data: Partial<T>,
  ): T {
    const rows = this.getTable(table);
    const nextId = (this.memoryAutoIncrement.get(table) ?? 0) + 1;
    this.memoryAutoIncrement.set(table, nextId);

    const record = { id: nextId, ...data } as MemoryRow;
    rows.push(record);
    return record as unknown as T;
  }

  private memoryUpdate<T extends Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    where: WhereClause,
  ): number {
    const rows = this.getTable(table);
    let count = 0;
    for (const row of rows) {
      if (this.matchesWhere(row, where)) {
        Object.assign(row, data);
        count++;
      }
    }
    return count;
  }
}

/** Thrown by getDb() on web — native-only escape hatch for raw SQL needs. */
export class SqliteNotSupportedError extends Error {
  constructor() {
    super('SQLite is only available on native builds.');
    this.name = 'SqliteNotSupportedError';
  }
}
