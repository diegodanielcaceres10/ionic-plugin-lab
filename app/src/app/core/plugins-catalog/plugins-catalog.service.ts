import { inject, Injectable } from '@angular/core';
import { SqliteService } from '../database/sqlite.service';
import { PLUGIN_CATALOG_SEED, PluginSeedEntry } from './plugins-catalog.data';

const TABLE = 'plugins';

export interface PluginCatalogEntry {
  id: number;
  name: string;
  category: string;
  icon: string;
  link?: string;
  pluginType: string;
  isTested: boolean;
  isFavorited: boolean;
}

export interface PluginCategoryGroup {
  label: string;
  plugins: PluginCatalogEntry[];
}

/** Row shape as stored in the `plugins` table (SQLite/in-memory). */
interface PluginRow extends Record<string, unknown> {
  id: number;
  name: string;
  category: string;
  icon: string;
  link: string | null;
  plugin_type: string;
  is_tested: number;
  is_favorited: number;
  last_used_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class PluginsCatalogService {
  private sqliteService = inject(SqliteService);

  async listGroupedByCategory(): Promise<PluginCategoryGroup[]> {
    this.seedIfEmpty();
    const entries: PluginCatalogEntry[] = await this.listAll();

    const groups = new Map<string, PluginCatalogEntry[]>();
    for (const entry of entries) {
      const list = groups.get(entry.category) ?? [];
      list.push(entry);
      groups.set(entry.category, list);
    }
    return Array.from(groups, ([label, plugins]) => ({ label, plugins }));
  }

  /** Returns every plugin in the catalog, unfiltered. */
  async listAll(): Promise<PluginCatalogEntry[]> {
    const rows = await this.sqliteService.select<PluginRow>(TABLE);
    return rows.map(this.toEntry);
  }

  /**
   * Loads PLUGIN_CATALOG_SEED into the `plugins` table, but only if it's
   * currently empty — safe to call on every app start.
   */
  async seedIfEmpty(): Promise<void> {
    const existing = await this.sqliteService.select<PluginRow>(TABLE, {
      limit: 1,
    });

    if (existing.length > 0) return;

    for (const entry of PLUGIN_CATALOG_SEED) {
      await this.sqliteService.insert(TABLE, this.toRow(entry));
    }
  }

  /** Sets (or clears) the favorite flag for a single plugin, by id. */
  async setFavorited(id: number, isFavorited: boolean): Promise<void> {
    const affected = await this.sqliteService.update<PluginRow>(
      TABLE,
      { is_favorited: isFavorited ? 1 : 0 },
      { id },
    );
    if (affected === 0) {
      throw new Error(`No plugin found with id ${id}`);
    }
  }

  /**
   * Marks a plugin as tested by name. One-way flag — safe to call
   * repeatedly (e.g. every time the plugin's demo page loads), it
   * simply stays at 1 once set.
   */
  async markAsTested(name: string): Promise<void> {
    const affected = await this.sqliteService.update<PluginRow>(
      TABLE,
      { is_tested: 1 },
      { name },
    );
    if (affected === 0) {
      throw new Error(`No plugin found with name "${name}"`);
    }
  }

  /** Finds a single plugin by its exact name, or null if none exists. */
  async findByName(name: string): Promise<PluginCatalogEntry | null> {
    const rows = await this.sqliteService.select<PluginRow>(TABLE, {
      where: { name },
      limit: 1,
    });
    return rows.length > 0 ? this.toEntry(rows[0]) : null;
  }

  private toRow(entry: PluginSeedEntry): Partial<PluginRow> {
    return {
      name: entry.name,
      category: entry.category,
      icon: entry.icon,
      link: entry.link ?? null,
      plugin_type: entry.pluginType,
      is_tested: 0,
      is_favorited: 0,
    };
  }

  private toEntry(row: PluginRow): PluginCatalogEntry {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      icon: row.icon,
      link: row.link ?? undefined,
      pluginType: row.plugin_type,
      isTested: !!row.is_tested,
      isFavorited: !!row.is_favorited,
    };
  }
}
