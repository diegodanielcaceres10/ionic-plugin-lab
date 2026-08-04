import { inject, Injectable } from '@angular/core';
import {
  Filesystem,
  Directory,
  Encoding,
  FileInfo,
} from '@capacitor/filesystem';
import { PlatformService } from '../../../core/platform/platform.service';

export { Directory };

export interface DirectoryOption {
  value: Directory;
  label: string;
  path: string;
}

/**
 * Thin wrapper around @capacitor/filesystem.
 * Centralizes encoding/path defaults so the page only deals with
 * plain strings (filename + content), not Capacitor's raw options.
 */
@Injectable({ providedIn: 'root' })
export class FilesystemService {
  private platformService = inject(PlatformService);

  readonly directoryOptions: DirectoryOption[] = [
    {
      value: Directory.Documents,
      label: 'Directory.Documents',
      path: '/storage/emulated/0/Documents',
    },
    {
      value: Directory.Data,
      label: 'Directory.Data',
      path: 'App private storage',
    },
    {
      value: Directory.Cache,
      label: 'Directory.Cache',
      path: 'App cache (no permission needed)',
    },
    {
      value: Directory.ExternalStorage,
      label: 'Directory.ExternalStorage',
      path: '/storage/emulated/0',
    },
  ];

  /**
   * Returns true when running inside a native app (Android/iOS),
   * false when running in the browser.
   */
  isNativePlatform(): boolean {
    return this.platformService.isNativePlatform();
  }

  async writeFile(
    path: string,
    data: string,
    directory: Directory,
  ): Promise<void> {
    await Filesystem.writeFile({
      path,
      data,
      directory,
      encoding: Encoding.UTF8,
    });
  }

  async readFile(path: string, directory: Directory): Promise<string> {
    const result = await Filesystem.readFile({
      path,
      directory,
      encoding: Encoding.UTF8,
    });
    return result.data as string;
  }

  async deleteFile(path: string, directory: Directory): Promise<void> {
    await Filesystem.deleteFile({ path, directory });
  }

  async mkdir(path: string, directory: Directory): Promise<void> {
    await Filesystem.mkdir({ path, directory, recursive: true });
  }

  /** Lists file/folder names at the root of the given directory. */
  async readdir(directory: Directory): Promise<string[]> {
    const result = await Filesystem.readdir({ path: '', directory });
    return result.files.map((f) => f.name);
  }

  async stat(path: string, directory: Directory): Promise<FileInfo> {
    return Filesystem.stat({ path, directory });
  }
}
