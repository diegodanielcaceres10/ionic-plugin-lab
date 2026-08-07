import { inject, Injectable } from '@angular/core';
import { SqliteService } from '../database/sqlite.service';

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

  async add(log: Omit<PluginLog, 'id' | 'createdAt'>): Promise<void> {
    const db = await this.sqliteService.getDb();
    await db.run(
      'INSERT INTO plugin_logs (plugin, type, status) VALUES (?, ?, ?);',
      [log.plugin, log.type, log.status],
    );
  }

  async list(filters: PluginLogFilters = {}): Promise<PluginLog[]> {
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
    const result = await db.query(
      `SELECT * FROM plugin_logs ${where} ORDER BY created_at DESC;`,
      params,
    );
    return (result.values ?? []).map(this.mapRow);
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
