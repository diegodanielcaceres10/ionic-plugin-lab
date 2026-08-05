import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
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

@Component({
  selector: 'app-filesystem',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
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
    });
  }

  /** Reads the current file status on load — no permission involved, safe to do silently. */
  async ngOnInit(): Promise<void> {
    this.isBrowser.set(this.filesystemService.isBrowser());
    this.fileInfo.set(await this.filesystemService.getDemoFileInfo());
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
