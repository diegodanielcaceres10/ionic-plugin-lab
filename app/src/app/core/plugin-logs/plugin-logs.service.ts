import { inject, Injectable } from '@angular/core';
import { SqliteService } from '../database/sqlite.service';
import { PlatformService } from '../platform/platform.service';

export interface PluginLog {
  id: number;
  plugin: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface PluginLogFilters {
  plugin?: string;
  status?: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class PluginLogsService {
  private sqliteService = inject(SqliteService);
  private platformService = inject(PlatformService);

  // Web fallback: kept only for the lifetime of the tab, never persisted.
  private memoryLogs: PluginLog[] = [];
  private nextMemoryId = 1;

  async add(log: Omit<PluginLog, 'id' | 'createdAt'>): Promise<void> {
    if (!this.platformService.isNativePlatform()) {
      this.memoryLogs.unshift({
        ...log,
        id: this.nextMemoryId++,
        createdAt: this.nowAsSqliteUtcString(),
      });
      return;
    }

    const db = await this.sqliteService.getDb();
    await db.run(
      'INSERT INTO plugin_logs (plugin, type, status) VALUES (?, ?, ?);',
      [log.plugin, log.type, log.status],
    );
  }

  async list(
    filters: PluginLogFilters = {},
    limit?: number,
  ): Promise<PluginLog[]> {
    if (!this.platformService.isNativePlatform()) {
      return this.listFromMemory(filters, limit);
    }

    const db = await this.sqliteService.getDb();
    const conditions: string[] = [];
    const params: string[] = [];

    if (filters.plugin) {
      conditions.push('plugin = ?');
      params.push(filters.plugin);
    }
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const result = await db.query(
      `SELECT * FROM plugin_logs ${where} ORDER BY created_at DESC ${limitClause};`,
      params,
    );
    return (result.values ?? []).map(this.mapRow);
  }

  /** Shortcut used by each plugin page to show its own Activity Log widget. */
  listRecent(plugin: string, limit = 5): Promise<PluginLog[]> {
    return this.list({ plugin }, limit);
  }

  private listFromMemory(
    filters: PluginLogFilters,
    limit?: number,
  ): PluginLog[] {
    const results = this.memoryLogs.filter(
      (log) =>
        (!filters.plugin || log.plugin === filters.plugin) &&
        (!filters.status || log.status === filters.status) &&
        (!filters.type || log.type === filters.type),
    );
    return limit ? results.slice(0, limit) : results;
  }

  /** Matches SQLite's `datetime('now')` output ('YYYY-MM-DD HH:MM:SS', UTC, no ms)
   *  so downstream parsing (camera.page.ts's toActivityEntry) works the same
   *  regardless of where the log came from. */
  private nowAsSqliteUtcString(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  private mapRow(row: {
    id: number;
    plugin: string;
    type: string;
    status: string;
    created_at: string;
  }): PluginLog {
    return {
      id: row.id,
      plugin: row.plugin,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
