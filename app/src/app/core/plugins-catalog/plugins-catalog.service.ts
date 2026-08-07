import { inject, Injectable } from '@angular/core';
import { SqliteService } from '../database/sqlite.service';
import { PlatformService } from '../platform/platform.service';
import { PLUGIN_CATALOG_SEED } from './plugins-catalog.data';

export interface PluginCatalogEntry {
  id?: number;
  name: string;
  category: string;
  icon: string;
  link?: string;
  isTested: boolean;
  isFavorited: boolean;
}

export interface PluginCategoryGroup {
  label: string;
  plugins: PluginCatalogEntry[];
}

@Injectable({ providedIn: 'root' })
export class PluginsCatalogService {
  private sqliteService = inject(SqliteService);
  private platformService = inject(PlatformService);
  private seeded = false;

  async listGroupedByCategory(): Promise<PluginCategoryGroup[]> {
    const entries = this.platformService.isNativePlatform()
      ? await this.listFromDb()
      : this.listFromSeed(); // web: sin persistencia de tested/favorited

    const groups = new Map<string, PluginCatalogEntry[]>();
    for (const entry of entries) {
      const list = groups.get(entry.category) ?? [];
      list.push(entry);
      groups.set(entry.category, list);
    }
    return Array.from(groups, ([label, plugins]) => ({ label, plugins }));
  }

  async setTested(name: string, isTested: boolean): Promise<void> {
    if (!this.platformService.isNativePlatform()) return; // web: stays in memory only
    const db = await this.sqliteService.getDb();
    await db.run('UPDATE plugins SET is_tested = ? WHERE name = ?;', [
      isTested ? 1 : 0,
      name,
    ]);
  }

  async setFavorited(name: string, isFavorited: boolean): Promise<void> {
    if (!this.platformService.isNativePlatform()) return; // web: stays in memory only
    const db = await this.sqliteService.getDb();
    await db.run('UPDATE plugins SET is_favorited = ? WHERE name = ?;', [
      isFavorited ? 1 : 0,
      name,
    ]);
  }

  private async listFromDb(): Promise<PluginCatalogEntry[]> {
    await this.ensureSeeded();
    const db = await this.sqliteService.getDb();
    const result = await db.query(
      'SELECT * FROM plugins ORDER BY category, name;',
    );
    return (result.values ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      icon: row.icon,
      link: row.link ?? undefined,
      isTested: !!row.is_tested,
      isFavorited: !!row.is_favorited,
    }));
  }

  private listFromSeed(): PluginCatalogEntry[] {
    return PLUGIN_CATALOG_SEED.map((seed) => ({
      ...seed,
      isTested: false,
      isFavorited: false,
    }));
  }

  /** Inserts the seed catalog once; existing rows (and their tested/favorited flags) are left untouched. */
  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    const db = await this.sqliteService.getDb();
    for (const plugin of PLUGIN_CATALOG_SEED) {
      await db.run(
        'INSERT OR IGNORE INTO plugins (name, category, icon, link) VALUES (?, ?, ?, ?);',
        [plugin.name, plugin.category, plugin.icon, plugin.link ?? null],
      );
    }
    this.seeded = true;
  }

  /** Marks a plugin as tested and bumps its last-used timestamp, in one write. */
  async recordUsage(name: string): Promise<void> {
    if (!this.platformService.isNativePlatform()) return; // web: nothing to persist
    const db = await this.sqliteService.getDb();
    await db.run(
      "UPDATE plugins SET is_tested = 1, last_used_at = datetime('now') WHERE name = ?;",
      [name],
    );
  }
}
