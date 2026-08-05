import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  globeOutline,
  helpCircleOutline,
  informationCircleOutline,
  linkOutline,
  createOutline,
  openOutline,
  closeOutline,
  timeOutline,
  logoGoogle,
  logoGithub,
  flashOutline,
  hardwareChipOutline,
} from 'ionicons/icons';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  BrowserService,
  QuickLink,
  QUICK_LINKS,
  DEFAULT_URL,
} from '../../data/browser.service';

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
  selector: 'app-browser',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonIcon,
  ],
  templateUrl: './browser.page.html',
  styleUrls: ['./browser.page.scss'],
})
export class BrowserPage implements OnInit, OnDestroy {
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  isOpen = signal(false);
  activeUrl = signal<string | null>(null);
  customUrl = signal(DEFAULT_URL);
  log = signal<LogEntry[]>([]);

  readonly quickLinks: QuickLink[] = QUICK_LINKS;

  private finishedHandle: PluginListenerHandle | null = null;
  private loadedHandle: PluginListenerHandle | null = null;

  constructor(private browserService: BrowserService) {
    addIcons({
      'globe-outline': globeOutline,
      'help-circle-outline': helpCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'link-outline': linkOutline,
      'create-outline': createOutline,
      'open-outline': openOutline,
      'close-outline': closeOutline,
      'time-outline': timeOutline,
      'logo-google': logoGoogle,
      'logo-github': logoGithub,
      'flash-outline': flashOutline,
      'hardware-chip-outline': hardwareChipOutline,
    });
  }

  /** Registers the plugin listeners once — no permission involved, safe to do silently. */
  async ngOnInit(): Promise<void> {
    this.isBrowserEnv.set(this.browserService.isBrowser());

    this.finishedHandle = await this.browserService.onFinished(() => {
      this.isOpen.set(false);
      this.pushLog('Browser closed', 'info');
    });

    this.loadedHandle = await this.browserService.onPageLoaded(() => {
      this.pushLog('Page loaded', 'success');
    });
  }

  async open(url: string): Promise<void> {
    await this.run(async () => {
      await this.browserService.open(url);
      this.isOpen.set(true);
      this.activeUrl.set(url);
      this.pushLog(`Opened ${url}`, 'success');
    });
  }

  async openCustom(): Promise<void> {
    await this.open(this.normalizeUrl(this.customUrl()));
  }

  async close(): Promise<void> {
    await this.run(async () => {
      await this.browserService.close();
      this.isOpen.set(false);
      this.pushLog('Browser closed manually', 'info');
    });
  }

  onCustomUrlChange(event: Event): void {
    this.customUrl.set((event.target as HTMLInputElement).value);
  }

  /** Adds https:// when the user typed a bare domain, e.g. "github.com". */
  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
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

  ngOnDestroy(): void {
    void this.finishedHandle?.remove();
    void this.loadedHandle?.remove();
  }
}
