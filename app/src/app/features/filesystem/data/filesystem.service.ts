import { inject, Injectable } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

const DEMO_DIR = 'demo';
const DEMO_FILE_NAME = 'notes.txt';
const DEMO_FILE_PATH = `${DEMO_DIR}/${DEMO_FILE_NAME}`;

export interface FileEntryInfo {
  name: string;
  path: string;
  size: number;
  sizeLabel: string;
  modifiedLabel: string;
  type: 'file' | 'directory';
}

export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  sizeLabel: string;
}

/**
 * Wraps @capacitor/filesystem to demo its core operations against a single
 * demo file (Directory.Data/demo/notes.txt). Directory.Data is app-private
 * storage on both platforms, so none of this needs runtime permissions.
 */
@Injectable({ providedIn: 'root' })
export class FilesystemService {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  constructor(private platformService: PlatformService) {}

  /**
   * True when running in the browser, where the plugin falls back to a
   * simulated (IndexedDB-backed) store instead of the real device disk.
   * Useful to show an informational note, not to block any action.
   */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  /** Creates (or overwrites) the demo file with a fresh timestamped line. */
  async writeDemoFile(): Promise<FileEntryInfo> {
    try {
      const content = `Entry created at ${new Date().toLocaleString()}\n`;
      await Filesystem.writeFile({
        path: DEMO_FILE_PATH,
        data: content,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      const info = await this.requireInfo();
      await this.saveLog('Write', 'File created', 'success');
      return info;
    } catch (error) {
      await this.saveLog(
        'Write',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Reads and returns the full text content of the demo file. */
  async readDemoFile(): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: DEMO_FILE_PATH,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const content = result.data as string;
      await this.saveLog(
        'Read',
        `File read (${content.length} chars)`,
        'success',
      );
      return content;
    } catch (error) {
      await this.saveLog(
        'Read',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Appends a new timestamped line, keeping whatever was already there. */
  async appendToDemoFile(): Promise<FileEntryInfo> {
    try {
      const line = `Entry appended at ${new Date().toLocaleString()}\n`;
      await Filesystem.appendFile({
        path: DEMO_FILE_PATH,
        data: line,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const info = await this.requireInfo();
      await this.saveLog('Append', 'Line appended', 'success');
      return info;
    } catch (error) {
      await this.saveLog(
        'Append',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /**
   * File metadata (size, type, modified date), or null if it doesn't exist yet.
   * @param logAction Pass false for silent/background reads (e.g. the initial
   *   load on page open) so they don't clutter the activity log — only the
   *   explicit "Refresh Info" action should log.
   */
  async getDemoFileInfo(logAction = true): Promise<FileEntryInfo | null> {
    try {
      const stat = await Filesystem.stat({
        path: DEMO_FILE_PATH,
        directory: Directory.Data,
      });
      const info: FileEntryInfo = {
        name: DEMO_FILE_NAME,
        path: DEMO_FILE_PATH,
        size: stat.size,
        sizeLabel: this.formatBytes(stat.size),
        modifiedLabel: this.formatDate(stat.mtime),
        type: stat.type === 'directory' ? 'directory' : 'file',
      };
      if (logAction) {
        await this.saveLog('Info', 'Info refreshed', 'success');
      }
      return info;
    } catch {
      if (logAction) {
        await this.saveLog('Info', 'File no longer exists', 'warning');
      }
      return null;
    }
  }

  /** Lists every entry inside the demo folder (empty array if it doesn't exist yet). */
  async listDemoDirectory(): Promise<DirectoryEntry[]> {
    try {
      const result = await Filesystem.readdir({
        path: DEMO_DIR,
        directory: Directory.Data,
      });
      const entries = result.files.map((f) => ({
        name: f.name,
        type:
          f.type === 'directory' ? ('directory' as const) : ('file' as const),
        sizeLabel: this.formatBytes(f.size),
      }));
      await this.saveLog(
        'List',
        `Directory listed (${entries.length} item${entries.length === 1 ? '' : 's'})`,
        'success',
      );
      return entries;
    } catch {
      await this.saveLog('List', 'Directory not found', 'warning');
      return [];
    }
  }

  /** Deletes the demo file. Safe to call even if it's already gone. */
  async deleteDemoFile(): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: DEMO_FILE_PATH,
        directory: Directory.Data,
      });
      // 'warning' (not 'danger') on purpose: the delete itself succeeded —
      // this is a real, valid interaction and should still count as tested.
      await this.saveLog('Delete', 'File deleted', 'warning');
    } catch {
      // Already gone — nothing to do, nothing to log.
    }
  }

  /** stat() right after a write/append should never miss — surfaces as a real error if it does. */
  private async requireInfo(): Promise<FileEntryInfo> {
    const info = await this.getDemoFileInfo(false);
    if (!info) {
      throw new Error('FILE_INFO_UNAVAILABLE');
    }
    return info;
  }

  /** Writes the activity log entry and, on success, marks Filesystem as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Filesystem',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Filesystem');
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  private formatDate(ms: number): string {
    return new Date(ms).toLocaleString();
  }
}
