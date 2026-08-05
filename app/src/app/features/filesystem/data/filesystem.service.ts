import { Injectable } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { PlatformService } from '../../../core/platform/platform.service';

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
    const content = `Entry created at ${new Date().toLocaleString()}\n`;
    await Filesystem.writeFile({
      path: DEMO_FILE_PATH,
      data: content,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return this.requireInfo();
  }

  /** Reads and returns the full text content of the demo file. */
  async readDemoFile(): Promise<string> {
    const result = await Filesystem.readFile({
      path: DEMO_FILE_PATH,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return result.data as string;
  }

  /** Appends a new timestamped line, keeping whatever was already there. */
  async appendToDemoFile(): Promise<FileEntryInfo> {
    const line = `Entry appended at ${new Date().toLocaleString()}\n`;
    await Filesystem.appendFile({
      path: DEMO_FILE_PATH,
      data: line,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return this.requireInfo();
  }

  /** File metadata (size, type, modified date), or null if it doesn't exist yet. */
  async getDemoFileInfo(): Promise<FileEntryInfo | null> {
    try {
      const stat = await Filesystem.stat({
        path: DEMO_FILE_PATH,
        directory: Directory.Data,
      });
      return {
        name: DEMO_FILE_NAME,
        path: DEMO_FILE_PATH,
        size: stat.size,
        sizeLabel: this.formatBytes(stat.size),
        modifiedLabel: this.formatDate(stat.mtime),
        type: stat.type === 'directory' ? 'directory' : 'file',
      };
    } catch {
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
      return result.files.map((f) => ({
        name: f.name,
        type: f.type === 'directory' ? 'directory' : 'file',
        sizeLabel: this.formatBytes(f.size),
      }));
    } catch {
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
    } catch {
      // Already gone — nothing to do.
    }
  }

  /** stat() right after a write/append should never miss — surfaces as a real error if it does. */
  private async requireInfo(): Promise<FileEntryInfo> {
    const info = await this.getDemoFileInfo();
    if (!info) {
      throw new Error('FILE_INFO_UNAVAILABLE');
    }
    return info;
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
