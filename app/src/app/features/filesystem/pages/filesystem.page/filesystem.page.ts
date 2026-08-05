import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { BannerComponent } from '../../../../shared/ui/banner/banner.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  eyeOutline,
  addCircleOutline,
  refreshOutline,
  listOutline,
  trashOutline,
  readerOutline,
  informationCircleOutline,
  helpCircleOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  documentOutline,
  folderOutline,
  folderOpenOutline,
  layersOutline,
  timeOutline,
  appsOutline,
} from 'ionicons/icons';
import {
  FilesystemService,
  FileEntryInfo,
  DirectoryEntry,
} from '../../data/filesystem.service';

type BannerVariant = 'info' | 'success' | 'danger' | 'disabled';
type LogVariant = 'success' | 'danger' | 'info';

interface LogEntry {
  message: string;
  variant: LogVariant;
  timestamp: number;
}

/** How many entries to keep in the "Activity Log" list. */
const LOG_LIMIT = 5;

type ActionKey = 'write' | 'read' | 'append' | 'refresh' | 'list' | 'delete';

interface QuickAction {
  key: ActionKey;
  label: string;
  icon: string;
  /** Accent color for the icon on the grid card (any valid CSS color). */
  color: string;
}

/** Actions that only make sense once the demo file exists. */
const REQUIRES_FILE: ReadonlySet<ActionKey> = new Set([
  'read',
  'append',
  'refresh',
  'delete',
]);

@Component({
  selector: 'app-filesystem',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    BannerComponent,
    IonIcon,
  ],
  templateUrl: './filesystem.page.html',
  styleUrls: ['./filesystem.page.scss'],
})
export class FilesystemPage implements OnInit {
  isBusy = signal(false);
  isBrowser = signal(false);
  fileInfo = signal<FileEntryInfo | null>(null);
  fileContent = signal<string | null>(null);
  entries = signal<DirectoryEntry[]>([]);
  log = signal<LogEntry[]>([]);

  readonly hasFile = computed(() => this.fileInfo() !== null);

  readonly bannerVariant = computed<BannerVariant>(() =>
    this.fileInfo() ? 'success' : 'disabled',
  );

  readonly bannerIcon = computed(() =>
    this.fileInfo() ? 'document-text-outline' : 'help-circle-outline',
  );

  readonly bannerTitle = computed(() =>
    this.fileInfo() ? 'File ready' : 'No file yet',
  );

  readonly bannerSubtitle = computed(
    () => this.fileInfo()?.path ?? 'Create the demo file to get started',
  );

  readonly badgeLabel = computed(() => this.fileInfo()?.sizeLabel);

  readonly badgeIcon = computed(() =>
    this.fileInfo() ? 'checkmark-circle-outline' : undefined,
  );

  readonly quickActions: QuickAction[] = [
    {
      key: 'write',
      label: 'Write Demo File',
      icon: 'create-outline',
      color: 'var(--ion-color-primary)',
    },
    {
      key: 'read',
      label: 'Read File',
      icon: 'eye-outline',
      color: '#0ea5e9',
    },
    {
      key: 'append',
      label: 'Append Line',
      icon: 'add-circle-outline',
      color: '#2dd36f',
    },
    {
      key: 'refresh',
      label: 'Refresh Info',
      icon: 'refresh-outline',
      color: '#f5a623',
    },
    {
      key: 'list',
      label: 'List Directory',
      icon: 'list-outline',
      color: '#6c5ce7',
    },
    {
      key: 'delete',
      label: 'Delete File',
      icon: 'trash-outline',
      color: '#eb445a',
    },
  ];

  constructor(private filesystemService: FilesystemService) {
    addIcons({
      'create-outline': createOutline,
      'eye-outline': eyeOutline,
      'add-circle-outline': addCircleOutline,
      'refresh-outline': refreshOutline,
      'list-outline': listOutline,
      'trash-outline': trashOutline,
      'reader-outline': readerOutline,
      'information-circle-outline': informationCircleOutline,
      'help-circle-outline': helpCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'document-text-outline': documentTextOutline,
      'document-outline': documentOutline,
      'folder-outline': folderOutline,
      'folder-open-outline': folderOpenOutline,
      'layers-outline': layersOutline,
      'time-outline': timeOutline,
      'apps-outline': appsOutline,
    });
  }

  /** Reads the current file status on load — no permission involved, safe to do silently. */
  async ngOnInit(): Promise<void> {
    this.isBrowser.set(this.filesystemService.isBrowser());
    this.fileInfo.set(await this.filesystemService.getDemoFileInfo());
  }

  /** Routes a quick-action card tap to its corresponding operation. */
  onAction(key: ActionKey): void {
    switch (key) {
      case 'write':
        void this.writeFile();
        break;
      case 'read':
        void this.readFile();
        break;
      case 'append':
        void this.appendLine();
        break;
      case 'refresh':
        void this.refreshInfo();
        break;
      case 'list':
        void this.listDirectory();
        break;
      case 'delete':
        void this.deleteFile();
        break;
    }
  }

  /** Write and List work with no file yet; the rest need one to already exist. */
  isActionDisabled(key: ActionKey): boolean {
    if (this.isBusy()) {
      return true;
    }
    return REQUIRES_FILE.has(key) && !this.hasFile();
  }

  async writeFile(): Promise<void> {
    await this.run(async () => {
      const info = await this.filesystemService.writeDemoFile();
      this.fileInfo.set(info);
      this.pushLog('File created', 'success');
    });
  }

  async readFile(): Promise<void> {
    await this.run(async () => {
      const content = await this.filesystemService.readDemoFile();
      this.fileContent.set(content);
      this.pushLog(`File read (${content.length} chars)`, 'success');
    });
  }

  async appendLine(): Promise<void> {
    await this.run(async () => {
      const info = await this.filesystemService.appendToDemoFile();
      this.fileInfo.set(info);
      this.pushLog('Line appended', 'success');
    });
  }

  async refreshInfo(): Promise<void> {
    await this.run(async () => {
      const info = await this.filesystemService.getDemoFileInfo();
      this.fileInfo.set(info);
      this.pushLog(
        info ? 'Info refreshed' : 'File no longer exists',
        info ? 'success' : 'info',
      );
    });
  }

  async listDirectory(): Promise<void> {
    await this.run(async () => {
      const entries = await this.filesystemService.listDemoDirectory();
      this.entries.set(entries);
      this.pushLog(
        `Directory listed (${entries.length} item${entries.length === 1 ? '' : 's'})`,
        'success',
      );
    });
  }

  async deleteFile(): Promise<void> {
    await this.run(async () => {
      await this.filesystemService.deleteDemoFile();
      this.fileInfo.set(null);
      this.fileContent.set(null);
      this.pushLog('File deleted', 'danger');
    });
  }

  /** Shared wrapper: toggles the busy state and turns unexpected failures into a log entry. */
  private async run(action: () => Promise<void>): Promise<void> {
    this.isBusy.set(true);
    try {
      await action();
    } catch {
      this.pushLog('Something went wrong', 'danger');
    } finally {
      this.isBusy.set(false);
    }
  }

  private pushLog(message: string, variant: LogVariant): void {
    const entry: LogEntry = { message, variant, timestamp: Date.now() };
    this.log.update((entries) => [entry, ...entries].slice(0, LOG_LIMIT));
  }
}
