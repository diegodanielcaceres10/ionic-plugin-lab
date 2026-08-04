import { Component, signal, inject } from '@angular/core';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { AlertController, ActionSheetController } from '@ionic/angular';
import {
  Directory,
  DirectoryOption,
  FilesystemService,
} from '../../data/filesystem.service';

type LogStatus = 'success' | 'error';

interface LogEntry {
  status: LogStatus;
  title: string;
  message: string;
  timestamp: number;
}

interface OperationCard {
  id: string;
  icon: string;
  title: string;
  method: string;
  description: string;
  action: () => Promise<void>;
}

/**
 * Filesystem plugin demo page.
 * Exercises writeFile / readFile / deleteFile / mkdir / readdir / stat
 * against a user-selected Capacitor Directory, logging each result.
 */
@Component({
  selector: 'app-filesystem',
  standalone: true,
  imports: [ShellComponent, HeaderComponent, IonButton, IonIcon],
  templateUrl: './filesystem.page.html',
  styleUrls: ['./filesystem.page.scss'],
})
export class FilesystemPage {
  private fsService = inject(FilesystemService);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);

  directoryOptions = this.fsService.directoryOptions;
  selectedDirectory = signal<DirectoryOption>(
    this.directoryOptions[this.fsService.isNativePlatform() ? 0 : 1],
  );
  logs = signal<LogEntry[]>([]);

  operations: OperationCard[] = [
    {
      id: 'create',
      icon: 'document-attach-outline',
      title: 'Create File',
      method: 'writeFile',
      description: 'Create a new file with content',
      action: () => this.createFile(),
    },
    {
      id: 'read',
      icon: 'book-outline',
      title: 'Read File',
      method: 'readFile',
      description: 'Read content from a file',
      action: () => this.readFile(),
    },
    {
      id: 'overwrite',
      icon: 'create-outline',
      title: 'Overwrite File',
      method: 'writeFile',
      description: 'Replace file content by writing again',
      action: () => this.overwriteFile(),
    },
    {
      id: 'delete',
      icon: 'trash-outline',
      title: 'Delete File',
      method: 'deleteFile',
      description: 'Delete a file from the directory',
      action: () => this.deleteFile(),
    },
    {
      id: 'mkdir',
      icon: 'folder-open-outline',
      title: 'Create Folder',
      method: 'mkdir',
      description: 'Create a new directory',
      action: () => this.createFolder(),
    },
    {
      id: 'list',
      icon: 'list-outline',
      title: 'List Files',
      method: 'readdir',
      description: 'List all files and folders',
      action: () => this.listFiles(),
    },
    {
      id: 'stat',
      icon: 'information-circle-outline',
      title: 'File Info',
      method: 'stat',
      description: 'Get detailed information',
      action: () => this.fileInfo(),
    },
  ];

  async openDirectoryPicker(): Promise<void> {
    const options = this.fsService.isNativePlatform()
      ? this.directoryOptions
      : this.directoryOptions.filter((o) =>
          [Directory.Data, Directory.Cache].includes(o.value),
        );

    const sheet = await this.actionSheetCtrl.create({
      header: 'Select a directory',
      buttons: [
        ...options.map((option) => ({
          text: option.label,
          handler: () => this.selectedDirectory.set(option),
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async createFile(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Create File',
      inputs: [
        { name: 'filename', type: 'text', placeholder: 'example.txt' },
        { name: 'content', type: 'textarea', placeholder: 'File content' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create',
          handler: async (data) => {
            if (!data.filename) return false;
            try {
              await this.fsService.writeFile(
                data.filename,
                data.content ?? '',
                this.selectedDirectory().value,
              );
              this.logSuccess(
                'File created',
                `${data.filename} was created successfully.`,
              );
            } catch (err) {
              this.logError('Create failed', this.describeError(err));
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async readFile(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Read File',
      inputs: [{ name: 'filename', type: 'text', placeholder: 'example.txt' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Read',
          handler: async (data) => {
            if (!data.filename) return false;
            try {
              const content = await this.fsService.readFile(
                data.filename,
                this.selectedDirectory().value,
              );
              this.logSuccess(
                'File read',
                content.length > 120
                  ? `${content.slice(0, 120)}…`
                  : content || '(empty file)',
              );
            } catch (err) {
              this.logError('Read failed', this.describeError(err));
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async overwriteFile(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Overwrite File',
      inputs: [
        { name: 'filename', type: 'text', placeholder: 'example.txt' },
        { name: 'content', type: 'textarea', placeholder: 'New content' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Overwrite',
          handler: async (data) => {
            if (!data.filename) return false;
            try {
              await this.fsService.writeFile(
                data.filename,
                data.content ?? '',
                this.selectedDirectory().value,
              );
              this.logSuccess(
                'File overwritten',
                `${data.filename} content was replaced.`,
              );
            } catch (err) {
              this.logError('Overwrite failed', this.describeError(err));
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteFile(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete File',
      inputs: [{ name: 'filename', type: 'text', placeholder: 'example.txt' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async (data) => {
            if (!data.filename) return false;
            try {
              await this.fsService.deleteFile(
                data.filename,
                this.selectedDirectory().value,
              );
              this.logSuccess('File deleted', `${data.filename} was removed.`);
            } catch (err) {
              this.logError('Delete failed', this.describeError(err));
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async createFolder(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Create Folder',
      inputs: [{ name: 'foldername', type: 'text', placeholder: 'my-folder' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create',
          handler: async (data) => {
            if (!data.foldername) return false;
            try {
              await this.fsService.mkdir(
                data.foldername,
                this.selectedDirectory().value,
              );
              this.logSuccess(
                'Folder created',
                `${data.foldername} was created.`,
              );
            } catch (err) {
              this.logError('Create folder failed', this.describeError(err));
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async listFiles(): Promise<void> {
    try {
      const files = await this.fsService.readdir(
        this.selectedDirectory().value,
      );
      this.logSuccess(
        'Directory listed',
        files.length ? files.join(', ') : 'This directory is empty.',
      );
    } catch (err) {
      this.logError('List failed', this.describeError(err));
    }
  }

  private async fileInfo(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'File Info',
      inputs: [{ name: 'filename', type: 'text', placeholder: 'example.txt' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Get Info',
          handler: async (data) => {
            if (!data.filename) return false;
            try {
              const info = await this.fsService.stat(
                data.filename,
                this.selectedDirectory().value,
              );
              this.logSuccess(
                'File info',
                `Type: ${info.type} · Size: ${info.size} bytes · Modified: ${new Date(info.mtime).toLocaleString()}`,
              );
            } catch (err) {
              this.logError('Stat failed', this.describeError(err));
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  clearLog(): void {
    this.logs.set([]);
  }

  private logSuccess(title: string, message: string): void {
    this.pushLog({ status: 'success', title, message, timestamp: Date.now() });
  }

  private logError(title: string, message: string): void {
    this.pushLog({ status: 'error', title, message, timestamp: Date.now() });
  }

  private pushLog(entry: LogEntry): void {
    this.logs.update((current) => [entry, ...current].slice(0, 20));
  }

  private describeError(err: any): string {
    return err?.message ?? 'The operation could not be completed.';
  }

  timeLabel(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
}
