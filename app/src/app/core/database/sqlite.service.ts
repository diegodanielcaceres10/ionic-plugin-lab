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
     is_favorited INTEGER NOT NULL DEFAULT 0
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

/** Thrown on web, where this plugin has no implementation. */
export class SqliteNotSupportedError extends Error {
  constructor() {
    super('SQLite is only available on native builds.');
    this.name = 'SqliteNotSupportedError';
  }
}

/**
 * Centralizes the SQLite connection lifecycle so every table-specific
 * service (plugins catalog, logs, etc.) shares the same open DB instead
 * of each one managing its own connection.
 */
@Injectable({ providedIn: 'root' })
export class SqliteService {
  private platformService = inject(PlatformService);
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private dbPromise?: Promise<SQLiteDBConnection>;

  /** Lazily opens (or returns the already-open) app database. */
  getDb(): Promise<SQLiteDBConnection> {
    if (!this.platformService.isNativePlatform()) {
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
}
