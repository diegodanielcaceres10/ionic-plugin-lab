import { inject, Injectable } from '@angular/core';
import { SqliteService } from '../database/sqlite.service';

const TABLE = 'plugin_logs';

export interface PluginLogEntry {
  id?: number;
  plugin: string;
  type: string;
  status: string;
  createdAt: string;
}

interface PluginLogRow extends Record<string, unknown> {
  id: number;
  plugin: string;
  type: string;
  status: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class PluginLogsService {
  private sqliteService = inject(SqliteService);

  /** Inserts a new log entry. `createdAt` is stamped here, not left to the DB default. */
  async add(entry: Omit<PluginLogEntry, 'id' | 'createdAt'>): Promise<void> {
    await this.sqliteService.insert<PluginLogRow>(TABLE, {
      plugin: entry.plugin,
      type: entry.type,
      status: entry.status,
      created_at: new Date().toISOString(),
    });
  }

  /** Lists logs, most recent first. Pass `plugin` to filter by a single plugin's name. */
  async list(plugin?: string): Promise<PluginLogEntry[]> {
    const rows = await this.sqliteService.select<PluginLogRow>(TABLE, {
      where: plugin ? { plugin } : undefined,
      orderBy: 'created_at DESC',
    });
    return rows.map(this.toEntry);
  }

  private toEntry(row: PluginLogRow): PluginLogEntry {
    return {
      id: row.id,
      plugin: row.plugin,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
